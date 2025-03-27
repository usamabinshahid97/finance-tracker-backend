"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaudeService = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../../utils/logger");
const database_1 = require("../../config/database");
class ClaudeService {
    constructor() {
        this.apiKey = process.env.CLAUDE_API_KEY || "";
        this.apiUrl = "https://api.anthropic.com/v1/messages";
        if (!this.apiKey) {
            logger_1.logger.error("Claude API key is not configured");
            throw new Error("Claude API key is required");
        }
    }
    /**
     * Predicts the most appropriate category for a transaction
     */
    async predictCategory(transaction, userCategories) {
        try {
            // Format categories for prompt
            const categoryOptions = userCategories
                .map((cat) => `${cat.id}: ${cat.name} (${cat.type})`)
                .join("\n");
            // Create the prompt for Claude
            const prompt = `
        I need help categorizing a financial transaction:
        
        Transaction details:
        - Description: ${transaction.description}
        - Amount: ${transaction.amount}
        - Date: ${transaction.date.toISOString().split("T")[0]}
        - Is it an expense: ${transaction.isExpense ? "Yes" : "No"}
        
        Available categories:
        ${categoryOptions}
        
        Based on the transaction description, amount, and whether it's an expense or income, 
        which category is the most appropriate? Respond only with the category ID, category name, and confidence score (0-1).
        Format your response as JSON: {"categoryId": "id", "categoryName": "name", "confidence": 0.XX}
      `;
            // Call Claude API
            const response = await axios_1.default.post(this.apiUrl, {
                model: "claude-3-opus-20240229",
                messages: [
                    {
                        role: "user",
                        content: prompt,
                    },
                ],
                max_tokens: 150,
            }, {
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": this.apiKey,
                    "anthropic-version": "2023-06-01",
                },
            });
            // Extract and parse the prediction from Claude's response
            const content = response.data.content[0].text;
            // Find JSON in the response
            const jsonMatch = content.match(/\{.*\}/s);
            if (jsonMatch) {
                const prediction = JSON.parse(jsonMatch[0]);
                logger_1.logger.info(`Category predicted for transaction: ${prediction.categoryName}`);
                return prediction;
            }
            return null;
        }
        catch (error) {
            logger_1.logger.error("Error predicting category with Claude API", {
                error,
                transactionId: transaction.id,
            });
            return null;
        }
    }
    /**
     * Automatically categorizes a batch of transactions
     */
    async categorizeTransactions(transactionIds) {
        let categorizedCount = 0;
        try {
            const transactions = await database_1.prisma.transaction.findMany({
                where: {
                    id: { in: transactionIds },
                    categoryId: null, // Only uncategorized transactions
                },
            });
            if (!transactions.length) {
                return 0;
            }
            // Process each transaction
            for (const transaction of transactions) {
                // Get user's categories
                const userCategories = await database_1.prisma.category.findMany({
                    where: {
                        userId: transaction.userId,
                        deletedAt: null,
                    },
                });
                // Skip if user has no categories
                if (!userCategories.length)
                    continue;
                // Predict category
                const prediction = await this.predictCategory(transaction, userCategories);
                if (prediction && prediction.confidence > 0.7) {
                    // Update transaction with predicted category
                    await database_1.prisma.transaction.update({
                        where: { id: transaction.id },
                        data: { categoryId: prediction.categoryId },
                    });
                    categorizedCount++;
                }
            }
            logger_1.logger.info(`Automatically categorized ${categorizedCount} transactions`);
            return categorizedCount;
        }
        catch (error) {
            logger_1.logger.error("Error in batch transaction categorization", { error });
            return categorizedCount;
        }
    }
}
exports.ClaudeService = ClaudeService;
exports.default = new ClaudeService();
