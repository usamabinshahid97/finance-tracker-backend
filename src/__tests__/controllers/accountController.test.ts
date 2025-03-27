import request from "supertest";
import express from "express";
import { PrismaClient } from "@prisma/client";
import { accountController } from "../../api/controllers/accountController";
import Session from "supertokens-node/recipe/session";

// Mock dependencies
jest.mock("@prisma/client", () => {
  const mockPrismaClient = {
    account: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    transaction: {
      count: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

jest.mock("supertokens-node/recipe/session", () => ({
  Session: {
    getSession: jest.fn(),
  },
}));

import { prisma } from "../../config/database";
const mockSession = { getUserId: jest.fn() };

describe("Account Controller", () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Set up routes for testing
    app.get("/accounts", accountController.getAccounts);
    app.post("/accounts", accountController.createAccount);
    app.get("/accounts/:id", accountController.getAccount);
    app.put("/accounts/:id", accountController.updateAccount);
    app.delete("/accounts/:id", accountController.deleteAccount);

    // Reset mocks
    jest.clearAllMocks();
    (Session.getSession as jest.Mock).mockResolvedValue(mockSession);
    mockSession.getUserId.mockReturnValue("user-id-123");
  });

  describe("getAccounts", () => {
    it("should return accounts for the authenticated user", async () => {
      const mockAccounts = [
        { id: "1", name: "Checking", userId: "user-id-123" },
        { id: "2", name: "Savings", userId: "user-id-123" },
      ];

      (prisma.account.findMany as jest.Mock).mockResolvedValue(mockAccounts);

      const response = await request(app).get("/accounts");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockAccounts);
      expect(prisma.account.findMany).toHaveBeenCalledWith({
        where: { userId: "user-id-123" },
        orderBy: { name: "asc" },
      });
    });

    it("should handle errors", async () => {
      (prisma.account.findMany as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      const response = await request(app).get("/accounts");

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: "Failed to fetch accounts" });
    });
  });

  // Additional tests for other account controller methods would follow here
});
