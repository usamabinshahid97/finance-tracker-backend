"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MistralService = void 0;
const axios_1 = __importDefault(require("axios"));
const fs_1 = __importDefault(require("fs"));
const form_data_1 = __importDefault(require("form-data"));
const logger_1 = require("../../utils/logger");
const database_1 = require("../../config/database");
const client_1 = require("@prisma/client");
class MistralService {
    constructor() {
        this.apiKey = process.env.MISTRAL_API_KEY || "";
        this.apiUrl = "https://api.mistral.ai/v1/ocr";
        if (!this.apiKey) {
            logger_1.logger.error("Mistral API key is not configured");
            throw new Error("Mistral API key is required");
        }
    }
    /**
     * Extracts text from a statement file using Mistral OCR
     */
    async extractTextFromStatement(filePath) {
        try {
            const formData = new form_data_1.default();
            formData.append("file", fs_1.default.createReadStream(filePath));
            const response = await axios_1.default.post(this.apiUrl, formData, {
                headers: {
                    ...formData.getHeaders(),
                    Authorization: `Bearer ${this.apiKey}`,
                },
            });
            return response.data.text || "";
        }
        catch (error) {
            logger_1.logger.error("Error extracting text with Mistral OCR", {
                error,
                filePath,
            });
            throw new Error("Failed to extract text from statement");
        }
    }
    /**
     * Processes extracted text to identify transactions
     */
    async processExtractedText(text) {
        try {
            // Use Mistral API to extract structured transaction data
            const response = await axios_1.default.post("https://api.mistral.ai/v1/chat/completions", {
                model: "mistral-large-latest",
                messages: [
                    {
                        role: "system",
                        content: "You are a financial document processing assistant. Extract all transactions from the provided bank statement text into a structured JSON format.",
                    },
                    {
                        role: "user",
                        content: `Extract all transactions from this bank statement text into a JSON array. Each transaction should have date, description, amount, and isExpense (true for debits/negative amounts, false for credits/positive amounts):\n\n${text}`,
                    },
                ],
                response_format: { type: "json_object" },
            }, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${this.apiKey}`,
                },
            });
            const content = response.data.choices[0].message.content;
            const parsed = JSON.parse(content);
            if (Array.isArray(parsed.transactions)) {
                return parsed.transactions;
            }
            logger_1.logger.error("Unexpected response format from Mistral API", { content });
            return [];
        }
        catch (error) {
            logger_1.logger.error("Error processing extracted text", { error });
            return [];
        }
    }
    /**
     * Process a statement and create transactions
     */
    async processStatement(statementId) {
        try {
            // 1. Get the statement
            const statement = await database_1.prisma.statement.findUnique({
                where: { id: statementId },
            });
            if (!statement) {
                logger_1.logger.error(`Statement not found: ${statementId}`);
                return false;
            }
            // 2. Update status to PROCESSING
            await database_1.prisma.statement.update({
                where: { id: statementId },
                data: { processingStatus: client_1.StatementProcessingStatus.PROCESSING },
            });
            // 3. Extract text from statement
            const extractedText = await this.extractTextFromStatement(statement.filePath);
            if (!extractedText) {
                logger_1.logger.error(`Failed to extract text from statement: ${statementId}`);
                await this.markStatementFailed(statementId);
                return false;
            }
            // 4. Process the extracted text
            const transactions = await this.processExtractedText(extractedText);
            if (!transactions.length) {
                logger_1.logger.error(`No transactions extracted from statement: ${statementId}`);
                await this.markStatementFailed(statementId);
                return false;
            }
            // 5. Create transactions in database
            await this.createTransactionsFromStatement(statement, transactions);
            // 6. Update statement status to COMPLETED
            await database_1.prisma.statement.update({
                where: { id: statementId },
                data: {
                    processingStatus: client_1.StatementProcessingStatus.COMPLETED,
                    processedAt: new Date(),
                },
            });
            logger_1.logger.info(`Successfully processed statement: ${statementId}`);
            return true;
        }
        catch (error) {
            logger_1.logger.error("Error processing statement", { error, statementId });
            await this.markStatementFailed(statementId);
            return false;
        }
    }
    /**
     * Mark a statement as failed
     */
    async markStatementFailed(statementId) {
        await database_1.prisma.statement.update({
            where: { id: statementId },
            data: { processingStatus: client_1.StatementProcessingStatus.FAILED },
        });
    }
    /**
     * Create transactions from extracted data
     */
    async createTransactionsFromStatement(statement, transactions) {
        for (const transaction of transactions) {
            try {
                await database_1.prisma.transaction.create({
                    data: {
                        userId: statement.userId,
                        accountId: statement.accountId,
                        creditCardId: statement.creditCardId,
                        amount: transaction.amount,
                        description: transaction.description,
                        date: new Date(transaction.date),
                        isExpense: transaction.isExpense,
                    },
                });
            }
            catch (error) {
                logger_1.logger.error("Error creating transaction from statement", {
                    error,
                    statementId: statement.id,
                    transaction,
                });
            }
        }
    }
}
exports.MistralService = MistralService;
exports.default = new MistralService();
