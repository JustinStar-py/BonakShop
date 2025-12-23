// FILE: lib/redis.ts
// DESCRIPTION: Redis client setup for caching (serverless-compatible)

/**
 * Redis caching layer using Upstash Redis for serverless compatibility
 * 
 * Setup:
 * 1. Create account at https://upstash.com
 * 2. Create Redis database
 * 3. Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to .env
 * 
 * For local development without Redis:
 * - Falls back to in-memory cache
 * - Logs warnings about missing Redis
 */

import { Redis } from '@upstash/redis';

// In-memory fallback for development
class MemoryCache {
    private cache: Map<string, { value: any; expiry: number | null }> = new Map();

    async get<T>(key: string): Promise<T | null> {
        const item = this.cache.get(key);
        if (!item) return null;

        if (item.expiry && Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }

        return item.value as T;
    }

    async set(key: string, value: any, options?: { ex?: number }): Promise<void> {
        const expiry = options?.ex ? Date.now() + options.ex * 1000 : null;
        this.cache.set(key, { value, expiry });
    }

    async incr(key: string): Promise<number> {
        const current = await this.get<number>(key);
        const nextValue = (current ?? 0) + 1;
        const existing = this.cache.get(key);
        const expiry = existing?.expiry ?? null;
        this.cache.set(key, { value: nextValue, expiry });
        return nextValue;
    }

    async del(...keys: string[]): Promise<void> {
        keys.forEach(key => this.cache.delete(key));
    }

    async expire(key: string, seconds: number): Promise<void> {
        const item = this.cache.get(key);
        if (item) {
            item.expiry = Date.now() + seconds * 1000;
        }
    }

    async ttl(key: string): Promise<number> {
        const item = this.cache.get(key);
        if (!item) return -2;
        if (!item.expiry) return -1;
        const remainingMs = item.expiry - Date.now();
        if (remainingMs <= 0) {
            this.cache.delete(key);
            return -2;
        }
        return Math.ceil(remainingMs / 1000);
    }

    async flushdb(): Promise<void> {
        this.cache.clear();
    }

    async keys(pattern: string): Promise<string[]> {
        const regex = new RegExp(pattern.replace('*', '.*'));
        return Array.from(this.cache.keys()).filter(key => regex.test(key));
    }
}

// Initialize Redis client
let redisClient: Redis | MemoryCache;

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const hasRedisConfig = Boolean(redisUrl && redisToken);
const isProduction = process.env.NODE_ENV === 'production';
const isBuildPhase =
    process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.NEXT_PHASE === 'phase-production-export';

const logRedisError = (action: string, error: unknown, detail?: string) => {
    const suffix = detail ? ` (${detail})` : '';
    console.warn(`⚠️  Redis ${action} failed${suffix}`, error);
};

if (hasRedisConfig) {
    redisClient = new Redis({
        url: redisUrl!,
        token: redisToken!,
    });
    console.log('✅ Redis connected (Upstash)');
} else if (isProduction && !isBuildPhase) {
    throw new Error(
        'Redis configuration required in production. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.'
    );
} else {
    console.warn('⚠️  Redis not configured, using in-memory cache (dev only)');
    console.warn('    Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to .env');
    redisClient = new MemoryCache();
}

export const redis = redisClient;

const keyPart = (value: string | number | boolean | undefined | null): string =>
    encodeURIComponent(String(value ?? ''));

/**
 * Cache wrapper with automatic serialization
 */
export async function getCached<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 300 // 5 minutes default
): Promise<T> {
    // Try to get from cache
    let cached: string | null = null;
    try {
        cached = await redis.get<string>(key);
    } catch (error) {
        logRedisError('get', error, key);
    }

    if (cached !== null && cached !== undefined) {
        try {
            return JSON.parse(cached as string) as T;
        } catch (e) {
            // If parse fails, treat as string
            return cached as T;
        }
    }

    // Fetch fresh data
    const data = await fetcher();

    // Store in cache
    const serialized = typeof data === 'string' ? data : JSON.stringify(data);
    try {
        await redis.set(key, serialized, { ex: ttl });
    } catch (error) {
        logRedisError('set', error, key);
    }

    return data;
}

/**
 * Invalidate cache by pattern
 */
export async function invalidateCache(pattern: string): Promise<void> {
    try {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
            await redis.del(...keys);
        }
    } catch (error) {
        logRedisError('invalidate', error, pattern);
    }
}

/**
 * Cache key generators
 */
export const cacheKeys = {
    products: {
        list: (options: {
            page: number;
            limit: number;
            search?: string;
            categoryId?: string;
            supplierId?: string;
            sort?: string;
            status?: string | null;
        }) =>
            `products:list:${keyPart(options.page)}:${keyPart(options.limit)}:${keyPart(options.search || 'none')}:${keyPart(options.categoryId || 'all')}:${keyPart(options.supplierId || 'all')}:${keyPart(options.sort || 'newest')}:${keyPart(options.status || 'default')}`,
        detail: (id: string) => `products:detail:${keyPart(id)}`,
        listType: (type: string) => `products:lists:${keyPart(type)}`,
        featured: () => 'products:featured',
        newest: () => 'products:newest',
        bestsellers: () => 'products:bestsellers',
        category: (categoryId: string) => `products:category:${keyPart(categoryId)}`,
    },
    categories: {
        all: () => 'categories:all',
        detail: (id: string) => `categories:detail:${keyPart(id)}`,
    },
    recommendations: {
        user: (userId: string, limit?: number) => `recommendations:user:${keyPart(userId)}:${keyPart(limit ?? 'default')}`,
        product: (productId: string) => `recommendations:product:${keyPart(productId)}`,
        cart: (productIds: string[], limit?: number) => `recommendations:cart:${keyPart(productIds.join(','))}:${keyPart(limit ?? 'default')}`,
    },
    analytics: {
        sales: (days: number) => `analytics:sales:${days}`,
        inventory: () => 'analytics:inventory',
        customers: () => 'analytics:customers',
    },
    user: {
        profile: (userId: string) => `user:${userId}`,
        orders: (userId: string) => `user:orders:${userId}`,
    },
    suppliers: {
        all: () => 'suppliers:all',
        byCategory: (categoryId: string) => `suppliers:category:${keyPart(categoryId)}`,
    },
    distributors: {
        all: () => 'distributors:all',
    },
    banners: {
        active: () => 'banners:active',
        all: () => 'banners:all',
    },
    search: {
        products: (options: {
            query: string;
            categoryId?: string;
            supplierId?: string;
            minPrice?: number;
            maxPrice?: number;
            available?: boolean;
            page?: number;
            limit?: number;
            sortBy?: string;
        }) =>
            `search:products:${keyPart(options.query)}:${keyPart(options.categoryId || 'all')}:${keyPart(options.supplierId || 'all')}:${keyPart(options.minPrice ?? 'min')}:${keyPart(options.maxPrice ?? 'max')}:${keyPart(options.available ?? true)}:${keyPart(options.page ?? 1)}:${keyPart(options.limit ?? 12)}:${keyPart(options.sortBy || 'relevance')}`,
    },
    admin: {
        dashboard: () => 'admin:dashboard',
    },
};

/**
 * Preload popular data into cache
 */
export async function warmCache(): Promise<void> {
    console.log('🔥 Warming cache...');

    // This would be called on server startup or as a cron job
    // Preload frequently accessed data

    // Example: Preload featured products
    // const featured = await prisma.product.findMany({ where: { isFeatured: true } });
    // await redis.set(cacheKeys.products.featured(), JSON.stringify(featured), { ex: 600 });

    console.log('✅ Cache warmed');
}
