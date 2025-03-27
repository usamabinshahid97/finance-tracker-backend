"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionController = void 0;
const session_1 = __importDefault(require("supertokens-node/recipe/session"));
const database_1 = require("../../config/database");
exports.transactionController = {
    // Get all transactions for the authenticated user
    async getTransactions(req, res) {
        try {
            const session = await session_1.default.getSession(req, res);
            const userId = session.getUserId();
            const filters = req.query;
            let whereClause = { userId };
            // Apply filters if provided
            if (filters.startDate)
                whereClause.date = { gte: new Date(filters.startDate) };
            if (filters.endDate)
                whereClause.date = {
                    ...whereClause.date,
                    lte: new Date(filters.endDate),
                };
            if (filters.categoryId)
                whereClause.categoryId = filters.categoryId;
            if (filters.isExpense !== undefined)
                whereClause.isExpense = filters.isExpense === "true";
            if (filters.accountId)
                whereClause.accountId = filters.accountId;
            if (filters.creditCardId)
                whereClause.creditCardId = filters.creditCardId;
            const transactions = await database_1.prisma.transaction.findMany({
                where: whereClause,
                include: {
                    category: true,
                    account: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    creditCard: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
                orderBy: {
                    date: "desc",
                },
            });
            res.json(transactions);
        }
        catch (error) {
            console.error("Error fetching transactions:", error);
            return void res
                .status(500)
                .json({ error: "Failed to fetch transactions" });
        }
    },
    // Create a new transaction
    async createTransaction(req, res) {
        try {
            const session = await session_1.default.getSession(req, res);
            const userId = session.getUserId();
            const { amount, description, date, categoryId, isExpense, accountId, creditCardId, } = req.body;
            // Validate request data
            if (!amount || !description || !date || isExpense === undefined) {
                return void res
                    .status(400)
                    .json({ error: "Missing required transaction data" });
            }
            // Validate that either accountId or creditCardId is provided
            if (!accountId && !creditCardId) {
                return void res
                    .status(400)
                    .json({ error: "Either accountId or creditCardId must be provided" });
            }
            // Create transaction
            const transaction = await database_1.prisma.transaction.create({
                data: {
                    userId,
                    amount: parseFloat(amount),
                    description,
                    date: new Date(date),
                    categoryId,
                    isExpense,
                    accountId: accountId || null,
                    creditCardId: creditCardId || null,
                },
            });
            // Update account or credit card balance
            if (accountId) {
                await database_1.prisma.account.update({
                    where: { id: accountId },
                    data: {
                        balance: {
                            [isExpense ? "decrement" : "increment"]: parseFloat(amount),
                        },
                    },
                });
            }
            else if (creditCardId) {
                await database_1.prisma.creditCard.update({
                    where: { id: creditCardId },
                    data: {
                        currentBalance: {
                            [isExpense ? "increment" : "decrement"]: parseFloat(amount),
                        },
                    },
                });
            }
            res.status(201).json(transaction);
        }
        catch (error) {
            console.error("Error creating transaction:", error);
            return void res
                .status(500)
                .json({ error: "Failed to create transaction" });
        }
    },
    // Update an existing transaction
    async updateTransaction(req, res) {
        try {
            const session = await session_1.default.getSession(req, res);
            const userId = session.getUserId();
            const { id } = req.params;
            // First, get the original transaction
            const originalTransaction = await database_1.prisma.transaction.findFirst({
                where: {
                    id,
                    userId,
                },
            });
            if (!originalTransaction) {
                return void res.status(404).json({ error: "Transaction not found" });
            }
            const { amount, description, date, categoryId, isExpense, accountId, creditCardId, } = req.body;
            // Update the transaction
            const updatedTransaction = await database_1.prisma.transaction.update({
                where: { id },
                data: {
                    amount: amount !== undefined ? parseFloat(amount) : undefined,
                    description,
                    date: date ? new Date(date) : undefined,
                    categoryId,
                    isExpense,
                    accountId,
                    creditCardId,
                },
            });
            // Handle balance updates if amount or isExpense changed
            if (amount !== originalTransaction.amount ||
                isExpense !== originalTransaction.isExpense) {
                // Revert original transaction's effect on balance
                if (originalTransaction.accountId) {
                    await database_1.prisma.account.update({
                        where: { id: originalTransaction.accountId },
                        data: {
                            balance: {
                                [originalTransaction.isExpense ? "increment" : "decrement"]: originalTransaction.amount,
                            },
                        },
                    });
                }
                else if (originalTransaction.creditCardId) {
                    await database_1.prisma.creditCard.update({
                        where: { id: originalTransaction.creditCardId },
                        data: {
                            currentBalance: {
                                [originalTransaction.isExpense ? "decrement" : "increment"]: originalTransaction.amount,
                            },
                        },
                    });
                }
                // Apply new transaction's effect on balance
                const targetId = accountId || originalTransaction.accountId;
                const targetCreditId = creditCardId || originalTransaction.creditCardId;
                if (targetId) {
                    await database_1.prisma.account.update({
                        where: { id: targetId },
                        data: {
                            balance: {
                                [isExpense ? "decrement" : "increment"]: parseFloat(amount),
                            },
                        },
                    });
                }
                else if (targetCreditId) {
                    await database_1.prisma.creditCard.update({
                        where: { id: targetCreditId },
                        data: {
                            currentBalance: {
                                [isExpense ? "increment" : "decrement"]: parseFloat(amount),
                            },
                        },
                    });
                }
            }
            res.json(updatedTransaction);
        }
        catch (error) {
            console.error("Error updating transaction:", error);
            return void res
                .status(500)
                .json({ error: "Failed to update transaction" });
        }
    },
    // Delete a transaction
    async deleteTransaction(req, res) {
        try {
            const session = await session_1.default.getSession(req, res);
            const userId = session.getUserId();
            const { id } = req.params;
            // Get the transaction before deleting
            const transaction = await database_1.prisma.transaction.findFirst({
                where: {
                    id,
                    userId,
                },
            });
            if (!transaction) {
                return void res.status(404).json({ error: "Transaction not found" });
            }
            // Delete the transaction
            await database_1.prisma.transaction.delete({
                where: { id },
            });
            // Update the balance
            if (transaction.accountId) {
                await database_1.prisma.account.update({
                    where: { id: transaction.accountId },
                    data: {
                        balance: {
                            [transaction.isExpense ? "increment" : "decrement"]: transaction.amount,
                        },
                    },
                });
            }
            else if (transaction.creditCardId) {
                await database_1.prisma.creditCard.update({
                    where: { id: transaction.creditCardId },
                    data: {
                        currentBalance: {
                            [transaction.isExpense ? "decrement" : "increment"]: transaction.amount,
                        },
                    },
                });
            }
            res.status(204).send();
        }
        catch (error) {
            console.error("Error deleting transaction:", error);
            return void res
                .status(500)
                .json({ error: "Failed to delete transaction" });
        }
    },
};
