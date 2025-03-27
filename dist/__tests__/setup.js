"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config({ path: ".env.test" });
// Create a singleton instance of Prisma for testing
const database_1 = require("../config/database");
// Global setup before all tests
beforeAll(async () => {
    // Create a clean test database
    await database_1.prisma.$connect();
});
// Clean up after each test
afterEach(async () => {
    // Delete all data after each test
    const tablenames = await database_1.prisma.$queryRaw `
    SELECT tablename FROM pg_tables WHERE schemaname='public'
  `;
    for (const { tablename } of tablenames) {
        if (tablename !== "_prisma_migrations") {
            await database_1.prisma.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE;`);
        }
    }
});
// Global teardown after all tests
afterAll(async () => {
    await database_1.prisma.$disconnect();
});
