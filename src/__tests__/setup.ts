// Global setup for tests
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import { string } from "joi";

// Load environment variables
dotenv.config({ path: ".env.test" });

// Create a singleton instance of Prisma for testing
import { prisma } from "../config/database";

// Global setup before all tests
beforeAll(async () => {
  // Create a clean test database
  await prisma.$connect();
});

// Clean up after each test
afterEach(async () => {
  // Delete all data after each test
  const tablenames = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname='public'
  `;

  for (const { tablename } of tablenames) {
    if (tablename !== "_prisma_migrations") {
      await prisma.$executeRawUnsafe(
        `TRUNCATE TABLE "public"."${tablename}" CASCADE;`
      );
    }
  }
});

// Global teardown after all tests
afterAll(async () => {
  await prisma.$disconnect();
});
