import { PrismaClient, Prisma } from "@prisma/client";
declare class ExtendedPrismaClient extends PrismaClient {
    constructor(options?: Prisma.PrismaClientOptions);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
}
export declare const prisma: ExtendedPrismaClient;
export declare function connectDatabase(): Promise<void>;
export declare function disconnectDatabase(): Promise<void>;
declare const _default: {
    prisma: ExtendedPrismaClient;
    connectDatabase: typeof connectDatabase;
    disconnectDatabase: typeof disconnectDatabase;
};
export default _default;
