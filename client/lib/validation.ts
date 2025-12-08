// FILE: lib/validation.ts
// DESCRIPTION: Zod schemas for API input validation

import { z } from 'zod';

// Product validation schemas
export const createProductSchema = z.object({
    name: z.string().min(1, 'نام محصول الزامی است').max(200),
    description: z.string().optional(),
    price: z.number().positive('قیمت باید مثبت باشد'),
    consumerPrice: z.number().positive().optional(),
    stock: z.number().int().min(0, 'موجودی نمی‌تواند منفی باشد'),
    discountPercentage: z.number().int().min(0).max(100).default(0),
    categoryId: z.string().cuid(),
    supplierId: z.string().cuid(),
    distributorId: z.string().cuid(),
    image: z.string().url().optional(),
    available: z.boolean().default(true),
    unit: z.string().default('عدد'),
    isFeatured: z.boolean().default(false)
});

export const updateProductSchema = createProductSchema.partial();

// Order validation schemas
export const createOrderSchema = z.object({
    items: z.array(z.object({
        productId: z.string().cuid(),
        productName: z.string(),
        quantity: z.number().int().positive('تعداد باید مثبت باشد'),
        price: z.number().positive('قیمت باید مثبت باشد')
    })).min(1, 'سفارش باید حداقل یک محصول داشته باشد'),
    totalPrice: z.number().positive('مبلغ کل باید مثبت باشد'),
    deliveryDate: z.string().datetime('تاریخ تحویل نامعتبر است'),
    settlementId: z.string().cuid(),
    notes: z.string().max(500).optional()
});

// User validation schemas
export const registerUserSchema = z.object({
    phone: z.string()
        .regex(/^09\d{9}$/, 'شماره تلفن باید با 09 شروع شده و 11 رقم باشد'),
    password: z.string().min(6, 'رمز عبور باید حداقل 6 کاراکتر باشد'),
    name: z.string().min(1).max(100).optional(),
    shopName: z.string().max(200).optional(),
    shopAddress: z.string().max(500).optional(),
    landline: z.string()
        .regex(/^0\d{10}$/, 'شماره ثابت باید 11 رقم باشد')
        .optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    userType: z.enum(['SHOP_OWNER', 'INDIVIDUAL']).default('SHOP_OWNER')
});

export const loginSchema = z.object({
    phone: z.string()
        .regex(/^09\d{9}$/, 'شماره تلفن نامعتبر است'),
    password: z.string().min(1, 'رمز عبور الزامی است')
});

// Chat validation schemas
export const sendMessageSchema = z.object({
    sessionId: z.string().cuid().optional(),
    content: z.string().min(1, 'پیام نمی‌تواند خالی باشد').max(1000, 'پیام بیش از حد طولانی است')
});

// Category, Supplier, Distributor schemas
export const createCategorySchema = z.object({
    name: z.string().min(1).max(100),
    icon: z.string().max(10).optional(),
    image: z.string().url().optional()
});

export const createSupplierSchema = z.object({
    name: z.string().min(1).max(200),
    logo: z.string().url().optional()
});

export const createDistributorSchema = z.object({
    name: z.string().min(1).max(200),
    logo: z.string().url().optional()
});

// Settlement schema
export const createSettlementSchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional()
});

// Return request schema
export const createReturnRequestSchema = z.object({
    orderId: z.string().cuid(),
    reason: z.string().max(500).optional(),
    items: z.array(z.object({
        orderItemId: z.string().cuid(),
        quantity: z.number().int().positive()
    })).min(1)
});

// Banner schema
export const createBannerSchema = z.object({
    title: z.string().min(1).max(200),
    image: z.string().url('آدرس تصویر نامعتبر است'),
    link: z.string().url().optional(),
    isActive: z.boolean().default(true),
    priority: z.number().int().default(0)
});

/**
 * Helper function to validate request body
 */
export function validateBody<T>(schema: z.ZodSchema<T>, body: unknown): {
    success: boolean;
    data?: T;
    error?: string;
} {
    try {
        const data = schema.parse(body);
        return { success: true, data };
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errorMessage = error.errors.map(e => e.message).join(', ');
            return { success: false, error: errorMessage };
        }
        return { success: false, error: 'خطای اعتبارسنجی' };
    }
}
