import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import { logger } from "../../utils/logger";
import { prisma } from "../../config/database";
import { StatementProcessingStatus } from "@prisma/client";
import mistralService from "../services/mistralService";
import claudeService from "../services/claudeService";

export class StatementController {
  /**
   * Get all statements for the authenticated user
   */
  async getStatements(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.session.userId;

      const statements = await prisma.statement.findMany({
        where: {
          userId,
          deletedAt: null,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      res.status(200).json({ statements });
    } catch (error) {
      logger.error("Error fetching statements", { error });
      res.status(500).json({ error: "Failed to fetch statements" });
    }
  }

  /**
   * Get a single statement with its processed transactions
   */
  async getStatement(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.session.userId;

      const statement = await prisma.statement.findFirst({
        where: {
          id,
          userId,
          deletedAt: null,
        },
      });

      if (!statement) {
        res.status(404).json({ error: "Statement not found" });
        return;
      }

      // Get transactions created from this statement
      // This would require adding a statementId field to transactions
      // For now, we'll determine by created time and account/card association
      const transactions = await prisma.transaction.findMany({
        where: {
          userId,
          deletedAt: null,
          ...(statement.accountId ? { accountId: statement.accountId } : {}),
          ...(statement.creditCardId
            ? { creditCardId: statement.creditCardId }
            : {}),
          createdAt: {
            gte: statement.createdAt,
            lte: statement.processedAt || new Date(),
          },
        },
        include: {
          category: true,
        },
        orderBy: {
          date: "desc",
        },
      });

      res.status(200).json({ statement, transactions });
    } catch (error) {
      logger.error("Error fetching statement", { error });
      res.status(500).json({ error: "Failed to fetch statement" });
    }
  }

  /**
   * Upload a new statement for processing
   */
  async uploadStatement(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No file uploaded" });
        return;
      }

      const userId = req.session.userId;
      const { accountId, creditCardId } = req.body;

      // Validation: one of accountId or creditCardId must be provided
      if (!accountId && !creditCardId) {
        res
          .status(400)
          .json({ error: "Either accountId or creditCardId must be provided" });
        return;
      }

      // Validate account/credit card ownership
      if (accountId) {
        const account = await prisma.account.findFirst({
          where: { id: accountId, userId, deletedAt: null },
        });

        if (!account) {
          res.status(404).json({ error: "Account not found" });
          return;
        }
      }

      if (creditCardId) {
        const creditCard = await prisma.creditCard.findFirst({
          where: { id: creditCardId, userId, deletedAt: null },
        });

        if (!creditCard) {
          res.status(404).json({ error: "Credit card not found" });
          return;
        }
      }

      // Define upload directory (ensure it exists)
      const uploadDir = path.join(__dirname, "../../../uploads", userId);
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Generate unique filename and move the file
      const fileExtension = path.extname(req.file.originalname);
      const fileName = `${uuidv4()}${fileExtension}`;
      const filePath = path.join(uploadDir, fileName);

      fs.renameSync(req.file.path, filePath);

      // Create statement record
      const statement = await prisma.statement.create({
        data: {
          user: { connect: { id: userId } },
          accountId: accountId || null,
          creditCardId: creditCardId || null,
          fileName: req.file.originalname,
          filePath,
          fileType: fileExtension?.substring(1),
          processingStatus: StatementProcessingStatus.PENDING,
        },
      });

      // Start processing in the background
      this.processStatementAsync(statement.id);

      res.status(201).json({
        message: "Statement uploaded successfully, processing has begun",
        statementId: statement.id,
      });
    } catch (error) {
      logger.error("Error uploading statement", { error });
      res.status(500).json({ error: "Failed to upload statement" });
    }
  }

  /**
   * Process a statement asynchronously
   */
  private async processStatementAsync(statementId: string): Promise<void> {
    try {
      // Process the statement with Mistral OCR
      const success = await mistralService.processStatement(statementId);

      if (success) {
        // Get uncategorized transactions from this statement processing
        const statement = await prisma.statement.findUnique({
          where: { id: statementId },
        });

        if (
          statement &&
          statement.processingStatus === StatementProcessingStatus.COMPLETED
        ) {
          // Find transactions created from this statement that need categorization
          const transactions = await prisma.transaction.findMany({
            where: {
              userId: statement.userId,
              categoryId: null,
              ...(statement.accountId
                ? { accountId: statement.accountId }
                : {}),
              ...(statement.creditCardId
                ? { creditCardId: statement.creditCardId }
                : {}),
              createdAt: {
                gte: statement.createdAt,
                lte: statement.processedAt || new Date(),
              },
            },
            select: { id: true },
          });

          if (transactions.length > 0) {
            // Extract transaction IDs
            const transactionIds = transactions.map((t) => t.id);

            // Categorize the transactions
            await claudeService.categorizeTransactions(transactionIds);
          }
        }
      }
    } catch (error) {
      logger.error("Error in async statement processing", {
        error,
        statementId,
      });
    }
  }
}

export default new StatementController();
