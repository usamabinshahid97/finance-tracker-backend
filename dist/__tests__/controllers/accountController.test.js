"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const accountController_1 = require("../../api/controllers/accountController");
const session_1 = __importDefault(require("supertokens-node/recipe/session"));
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
const database_1 = require("../../config/database");
const mockSession = { getUserId: jest.fn() };
describe("Account Controller", () => {
    let app;
    beforeEach(() => {
        app = (0, express_1.default)();
        app.use(express_1.default.json());
        // Set up routes for testing
        app.get("/accounts", accountController_1.accountController.getAccounts);
        app.post("/accounts", accountController_1.accountController.createAccount);
        app.get("/accounts/:id", accountController_1.accountController.getAccount);
        app.put("/accounts/:id", accountController_1.accountController.updateAccount);
        app.delete("/accounts/:id", accountController_1.accountController.deleteAccount);
        // Reset mocks
        jest.clearAllMocks();
        session_1.default.getSession.mockResolvedValue(mockSession);
        mockSession.getUserId.mockReturnValue("user-id-123");
    });
    describe("getAccounts", () => {
        it("should return accounts for the authenticated user", async () => {
            const mockAccounts = [
                { id: "1", name: "Checking", userId: "user-id-123" },
                { id: "2", name: "Savings", userId: "user-id-123" },
            ];
            database_1.prisma.account.findMany.mockResolvedValue(mockAccounts);
            const response = await (0, supertest_1.default)(app).get("/accounts");
            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockAccounts);
            expect(database_1.prisma.account.findMany).toHaveBeenCalledWith({
                where: { userId: "user-id-123" },
                orderBy: { name: "asc" },
            });
        });
        it("should handle errors", async () => {
            database_1.prisma.account.findMany.mockRejectedValue(new Error("Database error"));
            const response = await (0, supertest_1.default)(app).get("/accounts");
            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: "Failed to fetch accounts" });
        });
    });
    // Additional tests for other account controller methods would follow here
});
