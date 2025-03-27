"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatementController = void 0;
const uuid_1 = require("uuid");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("../../utils/logger");
const database_1 = require("../../config/database");
const client_1 = require("@prisma/client");
const mistralService_1 = __importDefault(require("../services/mistralService"));
const claudeService_1 = __importDefault(require("../services/claudeService"));
class StatementController {
    /**
     * Get all statements for the authenticated user
     */
    async getStatements(req, res) {
        try {
            const userId = req.session.userId;
            const statements = await database_1.prisma.statement.findMany({
                where: {
                    userId,
                    deletedAt: null,
                },
                orderBy: {
                    createdAt: "desc",
                },
            });
            res.status(200).json({ statements });
        }
        catch (error) {
            logger_1.logger.error("Error fetching statements", { error });
            res.status(500).json({ error: "Failed to fetch statements" });
        }
    }
    /**
     * Get a single statement with its processed transactions
     */
    async getStatement(req, res) {
        try {
            const { id } = req.params;
            const userId = req.session.userId;
            const statement = await database_1.prisma.statement.findFirst({
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
            const transactions = await database_1.prisma.transaction.findMany({
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
        }
        catch (error) {
            logger_1.logger.error("Error fetching statement", { error });
            res.status(500).json({ error: "Failed to fetch statement" });
        }
    }
    /**
     * Upload a new statement for processing
     */
    async uploadStatement(req, res) {
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
                const account = await database_1.prisma.account.findFirst({
                    where: { id: accountId, userId, deletedAt: null },
                });
                if (!account) {
                    res.status(404).json({ error: "Account not found" });
                    return;
                }
            }
            if (creditCardId) {
                const creditCard = await database_1.prisma.creditCard.findFirst({
                    where: { id: creditCardId, userId, deletedAt: null },
                });
                if (!creditCard) {
                    res.status(404).json({ error: "Credit card not found" });
                    return;
                }
            }
            // Define upload directory (ensure it exists)
            const uploadDir = path_1.default.join(__dirname, "../../../uploads", userId);
            if (!fs_1.default.existsSync(uploadDir)) {
                fs_1.default.mkdirSync(uploadDir, { recursive: true });
            }
            // Generate unique filename and move the file
            const fileExtension = path_1.default.extname(req.file.originalname);
            const fileName = `${(0, uuid_1.v4)()}${fileExtension}`;
            const filePath = path_1.default.join(uploadDir, fileName);
            fs_1.default.renameSync(req.file.path, filePath);
            // Create statement record
            const statement = await database_1.prisma.statement.create({
                data: {
                    user: { connect: { id: userId } },
                    accountId: accountId || null,
                    creditCardId: creditCardId || null,
                    fileName: req.file.originalname,
                    filePath,
                    fileType: fileExtension?.substring(1),
                    processingStatus: client_1.StatementProcessingStatus.PENDING,
                },
            });
            // Start processing in the background
            this.processStatementAsync(statement.id);
            res.status(201).json({
                message: "Statement uploaded successfully, processing has begun",
                statementId: statement.id,
            });
        }
        catch (error) {
            logger_1.logger.error("Error uploading statement", { error });
            res.status(500).json({ error: "Failed to upload statement" });
        }
    }
    /**
     * Process a statement asynchronously
     */
    async processStatementAsync(statementId) {
        try {
            // Process the statement with Mistral OCR
            const success = await mistralService_1.default.processStatement(statementId);
            if (success) {
                // Get uncategorized transactions from this statement processing
                const statement = await database_1.prisma.statement.findUnique({
                    where: { id: statementId },
                });
                if (statement &&
                    statement.processingStatus === client_1.StatementProcessingStatus.COMPLETED) {
                    // Find transactions created from this statement that need categorization
                    const transactions = await database_1.prisma.transaction.findMany({
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
                        await claudeService_1.default.categorizeTransactions(transactionIds);
                    }
                }
            }
        }
        catch (error) {
            logger_1.logger.error("Error in async statement processing", {
                error,
                statementId,
            });
        }
    }
}
exports.StatementController = StatementController;
exports.default = new StatementController();
