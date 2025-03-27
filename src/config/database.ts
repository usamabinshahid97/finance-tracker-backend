import { PrismaClient, Prisma } from "@prisma/client";
import { logger } from "../utils/logger";

// Define extended client with proper typings for the events
class ExtendedPrismaClient extends PrismaClient {
  constructor(options?: Prisma.PrismaClientOptions) {
    super(options);
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

// Create the client instance
export const prisma = new ExtendedPrismaClient({
  log:
    process.env.NODE_ENV === "development"
      ? [
          { emit: "stdout", level: "query" },
          { emit: "stdout", level: "error" },
        ]
      : [{ emit: "stdout", level: "error" }],
});

// Set up logging in development mode - access the _previewFeatures
if (process.env.NODE_ENV === "development") {
  // We'll use a middleware approach for logging instead of events
  prisma.$use(async (params, next) => {
    const before = Date.now();
    const result = await next(params);
    const after = Date.now();

    logger.debug("Prisma Query", {
      model: params.model,
      action: params.action,
      params: params.args,
      duration: `${after - before}ms`,
    });

    return result;
  });
}

// Log database errors using traditional try/catch
// We'll enhance error handling in our services

// Connect to database function
export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info("Successfully connected to the database");
  } catch (error) {
    logger.error("Failed to connect to the database", { error });
    process.exit(1);
  }
}

// Disconnect from database function
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info("Successfully disconnected from the database");
  } catch (error) {
    logger.error("Error disconnecting from the database", { error });
  }
}

// Handle process termination
process.on("SIGINT", async () => {
  logger.info("SIGINT received, shutting down gracefully");
  await disconnectDatabase();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down gracefully");
  await disconnectDatabase();
  process.exit(0);
});

export default { prisma, connectDatabase, disconnectDatabase };
