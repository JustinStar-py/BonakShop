/**
 * Tests for Zod validation schemas
 */

import { describe, it, expect } from 'vitest';
import {
    loginSchema,
    registerUserSchema,
    createProductSchema,
    createCategorySchema,
    createOrderSchema,
    sendMessageSchema,
    createBannerSchema,
    validateBody,
} from '@/lib/validation';

describe('loginSchema', () => {
    it('should validate correct phone and password', () => {
        const result = loginSchema.safeParse({
            phone: '09123456789',
            password: 'password123',
        });
        expect(result.success).toBe(true);
    });

    it('should reject phone without 09 prefix', () => {
        const result = loginSchema.safeParse({
            phone: '08123456789',
            password: 'password123',
        });
        expect(result.success).toBe(false);
    });

    it('should reject phone with wrong length', () => {
        const result = loginSchema.safeParse({
            phone: '0912345678', // 10 digits
            password: 'password123',
        });
        expect(result.success).toBe(false);
    });

    it('should reject empty password', () => {
        const result = loginSchema.safeParse({
            phone: '09123456789',
            password: '',
        });
        expect(result.success).toBe(false);
    });
});

describe('registerUserSchema', () => {
    it('should validate minimal registration data', () => {
        const result = registerUserSchema.safeParse({
            phone: '09123456789',
            password: 'password123',
        });
        expect(result.success).toBe(true);
    });

    it('should validate full registration data', () => {
        const result = registerUserSchema.safeParse({
            phone: '09123456789',
            password: 'password123',
            name: 'John Doe',
            shopName: 'My Shop',
            shopAddress: '123 Main St',
            landline: '02112345678',
            latitude: 35.6892,
            longitude: 51.3890,
            userType: 'SHOP_OWNER',
        });
        expect(result.success).toBe(true);
    });

    it('should reject short password', () => {
        const result = registerUserSchema.safeParse({
            phone: '09123456789',
            password: '12345', // less than 6 chars
        });
        expect(result.success).toBe(false);
    });

    it('should reject invalid latitude', () => {
        const result = registerUserSchema.safeParse({
            phone: '09123456789',
            password: 'password123',
            latitude: 100, // invalid
        });
        expect(result.success).toBe(false);
    });

    it('should reject invalid longitude', () => {
        const result = registerUserSchema.safeParse({
            phone: '09123456789',
            password: 'password123',
            longitude: 200, // invalid
        });
        expect(result.success).toBe(false);
    });

    it('should reject invalid userType', () => {
        const result = registerUserSchema.safeParse({
            phone: '09123456789',
            password: 'password123',
            userType: 'ADMIN', // invalid enum
        });
        expect(result.success).toBe(false);
    });
});

describe('createProductSchema', () => {
    it('should validate valid product data', () => {
        const result = createProductSchema.safeParse({
            name: 'Test Product',
            price: 100000,
            stock: 50,
            categoryId: 'clq1234567890abcdef',
            supplierId: 'clq1234567890suppli',
            distributorId: 'clq1234567890distri',
        });
        expect(result.success).toBe(true);
    });

    it('should reject negative price', () => {
        const result = createProductSchema.safeParse({
            name: 'Test Product',
            price: -100,
            stock: 50,
            categoryId: 'clq1234567890abcdef',
            supplierId: 'clq1234567890suppli',
            distributorId: 'clq1234567890distri',
        });
        expect(result.success).toBe(false);
    });

    it('should reject negative stock', () => {
        const result = createProductSchema.safeParse({
            name: 'Test Product',
            price: 100000,
            stock: -10,
            categoryId: 'clq1234567890abcdef',
            supplierId: 'clq1234567890suppli',
            distributorId: 'clq1234567890distri',
        });
        expect(result.success).toBe(false);
    });

    it('should reject discount over 100%', () => {
        const result = createProductSchema.safeParse({
            name: 'Test Product',
            price: 100000,
            stock: 50,
            discountPercentage: 150,
            categoryId: 'clq1234567890abcdef',
            supplierId: 'clq1234567890suppli',
            distributorId: 'clq1234567890distri',
        });
        expect(result.success).toBe(false);
    });

    it('should apply default values', () => {
        const result = createProductSchema.safeParse({
            name: 'Test Product',
            price: 100000,
            stock: 50,
            categoryId: 'clq1234567890abcdef',
            supplierId: 'clq1234567890suppli',
            distributorId: 'clq1234567890distri',
        });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.available).toBe(true);
            expect(result.data.unit).toBe('عدد');
            expect(result.data.isFeatured).toBe(false);
            expect(result.data.discountPercentage).toBe(0);
        }
    });
});

describe('createCategorySchema', () => {
    it('should validate valid category', () => {
        const result = createCategorySchema.safeParse({
            name: 'Electronics',
        });
        expect(result.success).toBe(true);
    });

    it('should reject empty name', () => {
        const result = createCategorySchema.safeParse({
            name: '',
        });
        expect(result.success).toBe(false);
    });

    it('should reject name over 100 chars', () => {
        const result = createCategorySchema.safeParse({
            name: 'A'.repeat(101),
        });
        expect(result.success).toBe(false);
    });
});

describe('createBannerSchema', () => {
    it('should validate valid banner', () => {
        const result = createBannerSchema.safeParse({
            title: 'Sale Banner',
            image: 'https://example.com/banner.jpg',
        });
        expect(result.success).toBe(true);
    });

    it('should reject invalid image URL', () => {
        const result = createBannerSchema.safeParse({
            title: 'Sale Banner',
            image: 'not-a-url',
        });
        expect(result.success).toBe(false);
    });
});

describe('sendMessageSchema', () => {
    it('should validate valid message', () => {
        const result = sendMessageSchema.safeParse({
            content: 'Hello, support!',
        });
        expect(result.success).toBe(true);
    });

    it('should reject empty message', () => {
        const result = sendMessageSchema.safeParse({
            content: '',
        });
        expect(result.success).toBe(false);
    });

    it('should reject message over 1000 chars', () => {
        const result = sendMessageSchema.safeParse({
            content: 'A'.repeat(1001),
        });
        expect(result.success).toBe(false);
    });
});

describe('validateBody helper', () => {
    it('should return success true for valid data', () => {
        const result = validateBody(loginSchema, {
            phone: '09123456789',
            password: 'password123',
        });
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
    });

    it('should return success false with error message for invalid data', () => {
        const result = validateBody(loginSchema, {
            phone: 'invalid',
            password: '',
        });
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.error).toContain('شماره تلفن نامعتبر است');
    });
});
