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

    async del(...keys: string[]): Promise<void> {
        keys.forEach(key => this.cache.delete(key));
    }

    async expire(key: string, seconds: number): Promise<void> {
        const item = this.cache.get(key);
        if (item) {
            item.expiry = Date.now() + seconds * 1000;
        }
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

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redisClient = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    console.log('✅ Redis connected (Upstash)');
} else {
    console.warn('⚠️  Redis not configured, using in-memory cache');
    console.warn('    Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to .env');
    redisClient = new MemoryCache();
}

export const redis = redisClient;

/**
 * Cache wrapper with automatic serialization
 */
export async function getCached<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 300 // 5 minutes default
): Promise<T> {
    // Try to get from cache
    const cached = await redis.get<string>(key);

    if (cached) {
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
    await redis.set(key, serialized, { ex: ttl });

    return data;
}

/**
 * Invalidate cache by pattern
 */
export async function invalidateCache(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
        await redis.del(...keys);
    }
}

/**
 * Cache key generators
 */
export const cacheKeys = {
    products: {
        list: (page: number, category?: string, supplier?: string) =>
            `products:list:${page}:${category || 'all'}:${supplier || 'all'}`,
        detail: (id: string) => `product:${id}`,
        featured: () => 'products:featured',
        newest: () => 'products:newest',
        bestsellers: () => 'products:bestsellers',
        category: (categoryId: string) => `products:category:${categoryId}`,
    },
    categories: {
        all: () => 'categories:all',
        detail: (id: string) => `category:${id}`,
    },
    recommendations: {
        user: (userId: string) => `recommendations:user:${userId}`,
        product: (productId: string) => `recommendations:product:${productId}`,
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
