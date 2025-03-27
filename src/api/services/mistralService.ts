import axios from "axios";
import fs from "fs";
import FormData from "form-data";
import { logger } from "../../utils/logger";
import { prisma } from "../../config/database";
import { StatementProcessingStatus } from "@prisma/client";

interface ExtractedTransaction {
  date: string;
  description: string;
  amount: number;
  isExpense: boolean;
}

export class MistralService {
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    this.apiKey = process.env.MISTRAL_API_KEY || "";
    this.apiUrl = "https://api.mistral.ai/v1/ocr";

    if (!this.apiKey) {
      logger.error("Mistral API key is not configured");
      throw new Error("Mistral API key is required");
    }
  }

  /**
   * Extracts text from a statement file using Mistral OCR
   */
  async extractTextFromStatement(filePath: string): Promise<string> {
    try {
      const formData = new FormData();
      formData.append("file", fs.createReadStream(filePath));

      const response = await axios.post(this.apiUrl, formData, {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      return response.data.text || "";
    } catch (error) {
      logger.error("Error extracting text with Mistral OCR", {
        error,
        filePath,
      });
      throw new Error("Failed to extract text from statement");
    }
  }

  /**
   * Processes extracted text to identify transactions
   */
  async processExtractedText(text: string): Promise<ExtractedTransaction[]> {
    try {
      // Use Mistral API to extract structured transaction data
      const response = await axios.post(
        "https://api.mistral.ai/v1/chat/completions",
        {
          model: "mistral-large-latest",
          messages: [
            {
              role: "system",
              content:
                "You are a financial document processing assistant. Extract all transactions from the provided bank statement text into a structured JSON format.",
            },
            {
              role: "user",
              content: `Extract all transactions from this bank statement text into a JSON array. Each transaction should have date, description, amount, and isExpense (true for debits/negative amounts, false for credits/positive amounts):\n\n${text}`,
            },
          ],
          response_format: { type: "json_object" },
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      const content = response.data.choices[0].message.content;
      const parsed = JSON.parse(content);

      if (Array.isArray(parsed.transactions)) {
        return parsed.transactions;
      }

      logger.error("Unexpected response format from Mistral API", { content });
      return [];
    } catch (error) {
      logger.error("Error processing extracted text", { error });
      return [];
    }
  }

  /**
   * Process a statement and create transactions
   */
  async processStatement(statementId: string): Promise<boolean> {
    try {
      // 1. Get the statement
      const statement = await prisma.statement.findUnique({
        where: { id: statementId },
      });

      if (!statement) {
        logger.error(`Statement not found: ${statementId}`);
        return false;
      }

      // 2. Update status to PROCESSING
      await prisma.statement.update({
        where: { id: statementId },
        data: { processingStatus: StatementProcessingStatus.PROCESSING },
      });

      // 3. Extract text from statement
      const extractedText = await this.extractTextFromStatement(
        statement.filePath
      );

      if (!extractedText) {
        logger.error(`Failed to extract text from statement: ${statementId}`);
        await this.markStatementFailed(statementId);
        return false;
      }

      // 4. Process the extracted text
      const transactions = await this.processExtractedText(extractedText);

      if (!transactions.length) {
        logger.error(
          `No transactions extracted from statement: ${statementId}`
        );
        await this.markStatementFailed(statementId);
        return false;
      }

      // 5. Create transactions in database
      await this.createTransactionsFromStatement(statement, transactions);

      // 6. Update statement status to COMPLETED
      await prisma.statement.update({
        where: { id: statementId },
        data: {
          processingStatus: StatementProcessingStatus.COMPLETED,
          processedAt: new Date(),
        },
      });

      logger.info(`Successfully processed statement: ${statementId}`);
      return true;
    } catch (error) {
      logger.error("Error processing statement", { error, statementId });
      await this.markStatementFailed(statementId);
      return false;
    }
  }

  /**
   * Mark a statement as failed
   */
  private async markStatementFailed(statementId: string): Promise<void> {
    await prisma.statement.update({
      where: { id: statementId },
      data: { processingStatus: StatementProcessingStatus.FAILED },
    });
  }

  /**
   * Create transactions from extracted data
   */
  private async createTransactionsFromStatement(
    statement: any,
    transactions: ExtractedTransaction[]
  ): Promise<void> {
    for (const transaction of transactions) {
      try {
        await prisma.transaction.create({
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
      } catch (error) {
        logger.error("Error creating transaction from statement", {
          error,
          statementId: statement.id,
          transaction,
        });
      }
    }
  }
}

export default new MistralService();
