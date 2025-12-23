// FILE: lib/rateLimit.ts
// DESCRIPTION: Rate limiting utility to prevent API abuse

import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

interface RateLimitStore {
    [key: string]: {
        count: number;
        resetTime: number;
    };
}

// In-memory store (use Redis in production)
const store: RateLimitStore = {};

interface RateLimitConfig {
    windowMs: number; // Time window in milliseconds
    max: number; // Maximum requests per window
    message?: string; // Custom error message
}

/**
 * Rate limiting middleware
 * @param identifier - Unique identifier (e.g., IP address or user ID)
 * @param config - Rate limit configuration
 * @returns true if request should be allowed, false if rate limited
 */
export async function checkRateLimit(
    identifier: string,
    config: RateLimitConfig = {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100,
        message: 'تعداد درخواست‌های شما بیش از حد مجاز است'
    }
): Promise<{ allowed: boolean; response?: NextResponse }> {
    const now = Date.now();
    const key = `ratelimit:${encodeURIComponent(identifier)}:${config.windowMs}:${config.max}`;

    try {
        const count = await redis.incr(key);
        if (count === 1) {
            await redis.expire(key, Math.ceil(config.windowMs / 1000));
        }

        if (count > config.max) {
            const ttlSeconds = await redis.ttl(key);
            const retryAfter = ttlSeconds > 0 ? ttlSeconds : Math.ceil(config.windowMs / 1000);
            return {
                allowed: false,
                response: new NextResponse(
                    JSON.stringify({
                        error: config.message,
                        retryAfter
                    }),
                    {
                        status: 429,
                        headers: {
                            'Content-Type': 'application/json',
                            'Retry-After': retryAfter.toString(),
                            'X-RateLimit-Limit': config.max.toString(),
                            'X-RateLimit-Remaining': '0',
                            'X-RateLimit-Reset': new Date(now + retryAfter * 1000).toISOString()
                        }
                    }
                )
            };
        }

        return { allowed: true };
    } catch (error) {
        // Fallback to in-memory store if Redis is unavailable
        if (store[key] && now > store[key].resetTime) {
            delete store[key];
        }

        if (!store[key]) {
            store[key] = {
                count: 1,
                resetTime: now + config.windowMs
            };
            return { allowed: true };
        }

        if (store[key].count >= config.max) {
            const retryAfter = Math.ceil((store[key].resetTime - now) / 1000);
            return {
                allowed: false,
                response: new NextResponse(
                    JSON.stringify({
                        error: config.message,
                        retryAfter
                    }),
                    {
                        status: 429,
                        headers: {
                            'Content-Type': 'application/json',
                            'Retry-After': retryAfter.toString(),
                            'X-RateLimit-Limit': config.max.toString(),
                            'X-RateLimit-Remaining': '0',
                            'X-RateLimit-Reset': new Date(store[key].resetTime).toISOString()
                        }
                    }
                )
            };
        }

        store[key].count++;
        return { allowed: true };
    }
}

/**
 * Helper function to get client identifier from request
 */
export function getClientIdentifier(request: Request): string {
    // Try to get IP from various headers (for production behind proxy)
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');

    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }

    if (realIp) {
        return realIp;
    }

    // Fallback (not reliable in production)
    return 'unknown';
}

/**
 * Cleanup function to periodically clear expired entries
 * Call this in a background job or cron
 */
export function cleanupRateLimitStore(): void {
    const now = Date.now();
    Object.keys(store).forEach(key => {
        if (store[key].resetTime < now) {
            delete store[key];
        }
    });
}
