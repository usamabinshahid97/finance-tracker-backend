import { Request, Response } from "express";
import Session from "supertokens-node/recipe/session";
import { prisma } from "../../config/database";

export const transactionController = {
  // Get all transactions for the authenticated user
  async getTransactions(req: Request, res: Response) {
    try {
      const session = await Session.getSession(req, res);
      const userId = session.getUserId();

      const filters = req.query;
      let whereClause: any = { userId };

      // Apply filters if provided
      if (filters.startDate)
        whereClause.date = { gte: new Date(filters.startDate as string) };
      if (filters.endDate)
        whereClause.date = {
          ...whereClause.date,
          lte: new Date(filters.endDate as string),
        };
      if (filters.categoryId)
        whereClause.categoryId = filters.categoryId as string;
      if (filters.isExpense !== undefined)
        whereClause.isExpense = filters.isExpense === "true";
      if (filters.accountId)
        whereClause.accountId = filters.accountId as string;
      if (filters.creditCardId)
        whereClause.creditCardId = filters.creditCardId as string;

      const transactions = await prisma.transaction.findMany({
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
    } catch (error) {
      console.error("Error fetching transactions:", error);
      return void res
        .status(500)
        .json({ error: "Failed to fetch transactions" });
    }
  },

  // Create a new transaction
  async createTransaction(req: Request, res: Response) {
    try {
      const session = await Session.getSession(req, res);
      const userId = session.getUserId();

      const {
        amount,
        description,
        date,
        categoryId,
        isExpense,
        accountId,
        creditCardId,
      } = req.body;

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
      const transaction = await prisma.transaction.create({
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
        await prisma.account.update({
          where: { id: accountId },
          data: {
            balance: {
              [isExpense ? "decrement" : "increment"]: parseFloat(amount),
            },
          },
        });
      } else if (creditCardId) {
        await prisma.creditCard.update({
          where: { id: creditCardId },
          data: {
            currentBalance: {
              [isExpense ? "increment" : "decrement"]: parseFloat(amount),
            },
          },
        });
      }

      res.status(201).json(transaction);
    } catch (error) {
      console.error("Error creating transaction:", error);
      return void res
        .status(500)
        .json({ error: "Failed to create transaction" });
    }
  },

  // Update an existing transaction
  async updateTransaction(req: Request, res: Response) {
    try {
      const session = await Session.getSession(req, res);
      const userId = session.getUserId();
      const { id } = req.params;

      // First, get the original transaction
      const originalTransaction = await prisma.transaction.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!originalTransaction) {
        return void res.status(404).json({ error: "Transaction not found" });
      }

      const {
        amount,
        description,
        date,
        categoryId,
        isExpense,
        accountId,
        creditCardId,
      } = req.body;

      // Update the transaction
      const updatedTransaction = await prisma.transaction.update({
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
      if (
        amount !== originalTransaction.amount ||
        isExpense !== originalTransaction.isExpense
      ) {
        // Revert original transaction's effect on balance
        if (originalTransaction.accountId) {
          await prisma.account.update({
            where: { id: originalTransaction.accountId },
            data: {
              balance: {
                [originalTransaction.isExpense ? "increment" : "decrement"]:
                  originalTransaction.amount,
              },
            },
          });
        } else if (originalTransaction.creditCardId) {
          await prisma.creditCard.update({
            where: { id: originalTransaction.creditCardId },
            data: {
              currentBalance: {
                [originalTransaction.isExpense ? "decrement" : "increment"]:
                  originalTransaction.amount,
              },
            },
          });
        }

        // Apply new transaction's effect on balance
        const targetId = accountId || originalTransaction.accountId;
        const targetCreditId = creditCardId || originalTransaction.creditCardId;

        if (targetId) {
          await prisma.account.update({
            where: { id: targetId },
            data: {
              balance: {
                [isExpense ? "decrement" : "increment"]: parseFloat(amount),
              },
            },
          });
        } else if (targetCreditId) {
          await prisma.creditCard.update({
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
    } catch (error) {
      console.error("Error updating transaction:", error);
      return void res
        .status(500)
        .json({ error: "Failed to update transaction" });
    }
  },

  // Delete a transaction
  async deleteTransaction(req: Request, res: Response) {
    try {
      const session = await Session.getSession(req, res);
      const userId = session.getUserId();
      const { id } = req.params;

      // Get the transaction before deleting
      const transaction = await prisma.transaction.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!transaction) {
        return void res.status(404).json({ error: "Transaction not found" });
      }

      // Delete the transaction
      await prisma.transaction.delete({
        where: { id },
      });

      // Update the balance
      if (transaction.accountId) {
        await prisma.account.update({
          where: { id: transaction.accountId },
          data: {
            balance: {
              [transaction.isExpense ? "increment" : "decrement"]:
                transaction.amount,
            },
          },
        });
      } else if (transaction.creditCardId) {
        await prisma.creditCard.update({
          where: { id: transaction.creditCardId },
          data: {
            currentBalance: {
              [transaction.isExpense ? "decrement" : "increment"]:
                transaction.amount,
            },
          },
        });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting transaction:", error);
      return void res
        .status(500)
        .json({ error: "Failed to delete transaction" });
    }
  },
};
