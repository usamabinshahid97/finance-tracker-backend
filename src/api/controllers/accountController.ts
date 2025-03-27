import { Request, Response } from "express";
import Session from "supertokens-node/recipe/session";
import { prisma } from "../../config/database";

export const accountController = {
  // Get all accounts for the authenticated user
  async getAccounts(req: Request, res: Response) {
    try {
      const session = await Session.getSession(req, res);
      const userId = session.getUserId();

      const accounts = await prisma.account.findMany({
        where: { userId },
        orderBy: { name: "asc" },
      });

      res.json(accounts);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      return void res.status(500).json({ error: "Failed to fetch accounts" });
    }
  },

  // Get a specific account by ID
  async getAccount(req: Request, res: Response) {
    try {
      const session = await Session.getSession(req, res);
      const userId = session.getUserId();
      const { id } = req.params;

      const account = await prisma.account.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!account) {
        return void res.status(404).json({ error: "Account not found" });
      }

      res.json(account);
    } catch (error) {
      console.error("Error fetching account:", error);
      return void res.status(500).json({ error: "Failed to fetch account" });
    }
  },

  // Create a new account
  async createAccount(req: Request, res: Response) {
    try {
      const session = await Session.getSession(req, res);
      const userId = session.getUserId();

      const { name, accountNumber, bankName, balance } = req.body;

      // Validate request data
      if (!name || !bankName) {
        return void res
          .status(400)
          .json({ error: "Missing required account data" });
      }

      // Create account
      const account = await prisma.account.create({
        data: {
          userId,
          name,
          accountNumber: accountNumber || "",
          bankName,
          balance: balance ? parseFloat(balance) : 0,
        },
      });

      res.status(201).json(account);
    } catch (error) {
      console.error("Error creating account:", error);
      return void res.status(500).json({ error: "Failed to create account" });
    }
  },

  // Update an existing account
  async updateAccount(req: Request, res: Response) {
    try {
      const session = await Session.getSession(req, res);
      const userId = session.getUserId();
      const { id } = req.params;

      // Check if account exists and belongs to user
      const existingAccount = await prisma.account.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!existingAccount) {
        return void res.status(404).json({ error: "Account not found" });
      }

      const { name, accountNumber, bankName, balance } = req.body;

      // Update account
      const updatedAccount = await prisma.account.update({
        where: { id },
        data: {
          name: name !== undefined ? name : undefined,
          accountNumber:
            accountNumber !== undefined ? accountNumber : undefined,
          bankName: bankName !== undefined ? bankName : undefined,
          balance: balance !== undefined ? parseFloat(balance) : undefined,
        },
      });

      res.json(updatedAccount);
    } catch (error) {
      console.error("Error updating account:", error);
      return void res.status(500).json({ error: "Failed to update account" });
    }
  },

  // Delete an account
  async deleteAccount(req: Request, res: Response) {
    try {
      const session = await Session.getSession(req, res);
      const userId = session.getUserId();
      const { id } = req.params;

      // Check if account exists and belongs to user
      const existingAccount = await prisma.account.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!existingAccount) {
        return void res.status(404).json({ error: "Account not found" });
      }

      // Check if account has transactions
      const transactionCount = await prisma.transaction.count({
        where: {
          accountId: id,
        },
      });

      if (transactionCount > 0) {
        return void res.status(400).json({
          error:
            "Cannot delete account with transactions. Please delete transactions first or transfer them to another account.",
        });
      }

      // Delete account
      await prisma.account.delete({
        where: { id },
      });

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting account:", error);
      return void res.status(500).json({ error: "Failed to delete account" });
    }
  },

  // Credit Card Management
  async getCreditCards(req: Request, res: Response) {
    try {
      const session = await Session.getSession(req, res);
      const userId = session.getUserId();

      const creditCards = await prisma.creditCard.findMany({
        where: { userId },
        orderBy: { name: "asc" },
      });

      res.json(creditCards);
    } catch (error) {
      console.error("Error fetching credit cards:", error);
      return void res
        .status(500)
        .json({ error: "Failed to fetch credit cards" });
    }
  },

  async createCreditCard(req: Request, res: Response) {
    try {
      const session = await Session.getSession(req, res);
      const userId = session.getUserId();

      const { name, cardNumber, bank, creditLimit } = req.body;

      // Validate request data
      if (!name || !bank || !creditLimit) {
        return void res
          .status(400)
          .json({ error: "Missing required credit card data" });
      }

      // Create credit card
      const creditCard = await prisma.creditCard.create({
        data: {
          userId,
          name,
          cardNumber: cardNumber || "",
          bank,
          creditLimit: parseFloat(creditLimit),
          currentBalance: 0,
        },
      });

      res.status(201).json(creditCard);
    } catch (error) {
      console.error("Error creating credit card:", error);
      return void res
        .status(500)
        .json({ error: "Failed to create credit card" });
    }
  },

  async updateCreditCard(req: Request, res: Response) {
    try {
      const session = await Session.getSession(req, res);
      const userId = session.getUserId();
      const { id } = req.params;

      // Check if credit card exists and belongs to user
      const existingCard = await prisma.creditCard.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!existingCard) {
        return void res.status(404).json({ error: "Credit card not found" });
      }

      const { name, cardNumber, bank, creditLimit } = req.body;

      // Update credit card
      const updatedCard = await prisma.creditCard.update({
        where: { id },
        data: {
          name: name !== undefined ? name : undefined,
          cardNumber: cardNumber !== undefined ? cardNumber : undefined,
          bank: bank !== undefined ? bank : undefined,
          creditLimit:
            creditLimit !== undefined ? parseFloat(creditLimit) : undefined,
        },
      });

      res.json(updatedCard);
    } catch (error) {
      console.error("Error updating credit card:", error);
      return void res
        .status(500)
        .json({ error: "Failed to update credit card" });
    }
  },

  async deleteCreditCard(req: Request, res: Response) {
    try {
      const session = await Session.getSession(req, res);
      const userId = session.getUserId();
      const { id } = req.params;

      // Check if credit card exists and belongs to user
      const existingCard = await prisma.creditCard.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!existingCard) {
        return void res.status(404).json({ error: "Credit card not found" });
      }

      // Check if credit card has transactions
      const transactionCount = await prisma.transaction.count({
        where: {
          creditCardId: id,
        },
      });

      if (transactionCount > 0) {
        return void res.status(400).json({
          error:
            "Cannot delete credit card with transactions. Please delete transactions first.",
        });
      }

      // Delete credit card
      await prisma.creditCard.delete({
        where: { id },
      });

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting credit card:", error);
      return void res
        .status(500)
        .json({ error: "Failed to delete credit card" });
    }
  },
};
