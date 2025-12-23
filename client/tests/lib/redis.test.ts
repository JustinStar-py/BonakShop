/**
 * Tests for Redis caching utilities
 * These test the cacheKeys helper functions separately
 */

import { describe, it, expect, vi } from 'vitest';

// Unmock redis for this file to test actual cacheKeys
vi.unmock('@/lib/redis');

// Import after unmock
const { cacheKeys } = await import('@/lib/redis');

describe('cacheKeys', () => {
    describe('products', () => {
        it('should generate list key with all options', () => {
            const key = cacheKeys.products.list({
                page: 1,
                limit: 10,
                search: 'test',
                categoryId: 'cat123',
                supplierId: 'sup456',
                sort: 'price',
                status: 'active',
            });
            expect(key).toContain('products');
            expect(key).toContain(':1:'); // page value
            expect(key).toContain(':10:'); // limit value
        });

        it('should generate list key without optional params', () => {
            const key = cacheKeys.products.list({ page: 1, limit: 10 });
            expect(key).toContain('products');
        });

        it('should generate detail key with id', () => {
            const key = cacheKeys.products.detail('prod123');
            expect(key).toContain('prod123');
        });

        it('should generate featured key', () => {
            const key = cacheKeys.products.featured();
            expect(key).toContain('featured');
        });

        it('should generate newest key', () => {
            const key = cacheKeys.products.newest();
            expect(key).toContain('newest');
        });

        it('should generate bestsellers key', () => {
            const key = cacheKeys.products.bestsellers();
            expect(key).toContain('bestsellers');
        });

        it('should generate category key', () => {
            const key = cacheKeys.products.category('cat123');
            expect(key).toContain('cat123');
        });
    });

    describe('categories', () => {
        it('should generate all key', () => {
            const key = cacheKeys.categories.all();
            expect(key).toContain('categories');
        });

        it('should generate detail key', () => {
            const key = cacheKeys.categories.detail('cat123');
            expect(key).toContain('cat123');
        });
    });

    describe('recommendations', () => {
        it('should generate user key', () => {
            const key = cacheKeys.recommendations.user('user123');
            expect(key).toContain('user123');
        });

        it('should generate product key', () => {
            const key = cacheKeys.recommendations.product('prod123');
            expect(key).toContain('prod123');
        });
    });

    describe('analytics', () => {
        it('should generate sales key', () => {
            const key = cacheKeys.analytics.sales(30);
            expect(key).toContain('30');
        });

        it('should generate inventory key', () => {
            const key = cacheKeys.analytics.inventory();
            expect(key).toContain('inventory');
        });
    });
});
