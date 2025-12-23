/**
 * Global test setup for Vitest
 * Mocks for Next.js APIs, Redis, and Prisma
 */

import { vi, beforeEach } from 'vitest';

// Mock Next.js server-only features
vi.mock('next/headers', () => ({
    cookies: () => ({
        get: vi.fn(),
        set: vi.fn(),
        delete: vi.fn(),
    }),
    headers: () => new Map(),
}));

vi.mock('next/cache', () => ({
    revalidateTag: vi.fn(),
    revalidatePath: vi.fn(),
}));

// Mock environment variables for tests
process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = 'test-cloud';
process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET = 'test-preset';
process.env.JWT_ACCESS_SECRET = 'test-jwt-secret-key-for-testing';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-for-testing';

// Mock Redis
vi.mock('@/lib/redis', () => ({
    redis: {
        get: vi.fn().mockResolvedValue(null),
        set: vi.fn().mockResolvedValue('OK'),
        del: vi.fn().mockResolvedValue(1),
        incr: vi.fn().mockResolvedValue(1),
        expire: vi.fn().mockResolvedValue(1),
        exists: vi.fn().mockResolvedValue(0),
    },
    getCached: vi.fn().mockImplementation(async (_key, fn) => fn()),
    invalidateCache: vi.fn().mockResolvedValue(undefined),
}));

// Mock Prisma Client
vi.mock('@/lib/prisma', () => ({
    prisma: {
        product: {
            findMany: vi.fn().mockResolvedValue([]),
            findUnique: vi.fn().mockResolvedValue(null),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            count: vi.fn().mockResolvedValue(0),
        },
        category: {
            findMany: vi.fn().mockResolvedValue([]),
            findUnique: vi.fn().mockResolvedValue(null),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
        user: {
            findUnique: vi.fn().mockResolvedValue(null),
            create: vi.fn(),
            update: vi.fn(),
        },
        order: {
            findMany: vi.fn().mockResolvedValue([]),
            findUnique: vi.fn().mockResolvedValue(null),
            create: vi.fn(),
            update: vi.fn(),
        },
        $transaction: vi.fn().mockImplementation((fn) => fn()),
    },
}));

// Global fetch mock (for Cloudinary, external APIs)
global.fetch = vi.fn();

// Reset all mocks before each test
beforeEach(() => {
    vi.clearAllMocks();
});
