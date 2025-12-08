// FILE: lib/db-pool.ts
// DESCRIPTION: Database connection pooling for better performance

import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

const prismaClientSingleton = () => {
    return new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],

        // Connection pool settings
        datasources: {
            db: {
                url: process.env.DATABASE_URL,
            },
        },
    });
};

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

// Graceful shutdown
if (typeof window === 'undefined') {
    process.on('beforeExit', async () => {
        await prisma.$disconnect();
    });
}

export default prisma;

/**
 * Query optimization helpers
 */

/**
 * Execute query with timeout
 */
export async function withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number = 5000
): Promise<T> {
    const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Query timeout')), timeoutMs)
    );

    return Promise.race([promise, timeout]);
}

/**
 * Batch multiple queries efficiently
 */
export async function batchQueries<T extends Record<string, Promise<any>>>(
    queries: T
): Promise<{ [K in keyof T]: Awaited<T[K]> }> {
    const keys = Object.keys(queries) as Array<keyof T>;
    const promises = Object.values(queries);

    const results = await Promise.all(promises);

    return keys.reduce((acc, key, index) => {
        acc[key] = results[index];
        return acc;
    }, {} as any);
}
