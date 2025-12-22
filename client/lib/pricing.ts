// FILE: lib/pricing.ts
// DESCRIPTION: Dynamic pricing algorithms based on inventory, demand, and time

import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getProductSalesHistory } from './analytics';
import { mapWithConcurrency } from './concurrency';

export interface PricingFactors {
    stockPressure: number;      // 0-1: Higher = more urgent to sell
    ageMultiplier: number;       // 0-1: Older products get higher discounts
    demandElasticity: number;    // 0-1: How price-sensitive is this product
    marketPosition: number;      // -1 to 1: Below/above market price
    profitMargin: number;        // Current margin percentage
}

export interface DynamicPriceRecommendation {
    productId: string;
    productName: string;
    currentPrice: number;
    currentDiscount: number;
    recommendedPrice: number;
    recommendedDiscount: number;
    expectedImpact: string;
    reasoning: string[];
    confidence: number;
}

type ProductWithCategory = Prisma.ProductGetPayload<{
    include: { category: true };
}>;

/**
 * Calculate optimal discount for a product based on multiple factors
 */
export async function calculateOptimalDiscount(
    productId: string
): Promise<DynamicPriceRecommendation | null> {
    const product = await prisma.product.findUnique({
        where: { id: productId },
        include: { category: true }
    });

    if (!product) return null;

    return calculateOptimalDiscountForProduct(product);
}

async function calculateOptimalDiscountForProduct(
    product: ProductWithCategory
): Promise<DynamicPriceRecommendation> {
    // Get pricing factors
    const factors = await analyzePricingFactors(product);

    // Calculate recommended discount
    let discountScore = 0;

    // Stock pressure (0-40 points)
    discountScore += factors.stockPressure * 40;

    // Age factor (0-20 points)
    discountScore += factors.ageMultiplier * 20;

    // Demand elasticity (0-15 points)
    discountScore += factors.demandElasticity * 15;

    // Market position adjustment (0-15 points)
    if (factors.marketPosition > 0) {
        // We're priced above market - add discount pressure
        discountScore += factors.marketPosition * 15;
    }

    // Margin protection - don't discount if margin is already thin
    if (factors.profitMargin < 10) {
        discountScore = Math.min(discountScore, 5); // Max 5% discount
    } else if (factors.profitMargin < 20) {
        discountScore = Math.min(discountScore, 15); // Max 15% discount
    }

    // Cap at reasonable maximums
    const recommendedDiscount = Math.min(Math.round(discountScore), 50);

    // Calculate new price
    const recommendedPrice = product.price * (1 - recommendedDiscount / 100);

    // Build reasoning
    const reasoning: string[] = [];

    if (factors.stockPressure > 0.7) {
        reasoning.push('موجودی بالا - نیاز به تخلیه انبار');
    }
    if (factors.ageMultiplier > 0.5) {
        reasoning.push('محصول قدیمی - نیاز به فروش سریع');
    }
    if (factors.demandElasticity > 0.6) {
        reasoning.push('محصول حساس به قیمت - تخفیف افزایش فروش می‌دهد');
    }
    if (factors.marketPosition > 0.3) {
        reasoning.push('قیمت بالاتر از بازار - رقابت‌پذیری کم');
    }
    if (factors.profitMargin < 15) {
        reasoning.push('حاشیه سود کم - تخفیف محدود');
    }

    // Determine expected impact
    let expectedImpact = 'افزایش فروش متوسط';
    if (recommendedDiscount > 30) {
        expectedImpact = 'افزایش قابل توجه فروش';
    } else if (recommendedDiscount < 10) {
        expectedImpact = 'افزایش جزئی فروش';
    }

    // Confidence score
    const confidence = calculateConfidence(factors);

    return {
        productId: product.id,
        productName: product.name,
        currentPrice: product.price,
        currentDiscount: product.discountPercentage,
        recommendedPrice,
        recommendedDiscount,
        expectedImpact,
        reasoning,
        confidence
    };
}

/**
 * Analyze pricing factors for a product
 */
async function analyzePricingFactors(product: ProductWithCategory): Promise<PricingFactors> {
    // 1. Stock pressure
    const salesHistory = await getProductSalesHistory(product.id, 30);
    const totalSold = salesHistory.reduce((sum, day) => sum + day.quantity, 0);
    const avgDailySales = totalSold / 30;

    let stockPressure = 0;
    if (avgDailySales > 0) {
        const daysOfStock = product.stock / avgDailySales;
        if (daysOfStock > 60) stockPressure = 1.0;      // Very high stock
        else if (daysOfStock > 30) stockPressure = 0.7; // High stock
        else if (daysOfStock > 14) stockPressure = 0.4; // Medium stock
        else stockPressure = 0.1;                        // Low stock - don't discount
    } else if (product.stock > 50) {
        stockPressure = 0.8; // No sales but high stock
    }

    // 2. Age multiplier
    const ageInDays = (Date.now() - product.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    let ageMultiplier = 0;
    if (ageInDays > 90) ageMultiplier = 1.0;      // Very old
    else if (ageInDays > 60) ageMultiplier = 0.7; // Old
    else if (ageInDays > 30) ageMultiplier = 0.4; // Medium age
    else ageMultiplier = 0.1;                      // New - don't discount much

    // 3. Demand elasticity (category-based approximation)
    const demandElasticity = getCategoryElasticity(product.category.name);

    // 4. Market position (would compare to competitors, using average as proxy)
    const categoryAverage = await prisma.product.aggregate({
        where: {
            categoryId: product.categoryId,
            available: true
        },
        _avg: { price: true }
    });

    let marketPosition = 0;
    if (categoryAverage._avg.price) {
        const priceDiff = product.price - categoryAverage._avg.price;
        marketPosition = priceDiff / categoryAverage._avg.price;
    }

    // 5. Profit margin
    let profitMargin = 20; // Default assumption
    if (
        product.consumerPrice &&
        product.consumerPrice > 0 &&
        Number.isFinite(product.price) &&
        product.price > 0
    ) {
        profitMargin = ((product.price - product.consumerPrice) / product.price) * 100;
    }

    return {
        stockPressure,
        ageMultiplier,
        demandElasticity,
        marketPosition,
        profitMargin
    };
}

/**
 * Get demand elasticity by category
 * Higher = more price-sensitive
 */
function getCategoryElasticity(categoryName: string): number {
    const elasticityMap: Record<string, number> = {
        'لبنیات': 0.7,           // Dairy - price sensitive
        'نوشیدنی': 0.8,          // Beverages - very price sensitive
        'تنقلات': 0.6,           // Snacks - moderately sensitive
        'روغن': 0.5,             // Oil - less sensitive (necessity)
        'شوینده و بهداشتی': 0.6, // Cleaning - moderately sensitive
        'کنسرویجات': 0.5         // Canned goods - less sensitive
    };

    return elasticityMap[categoryName] || 0.6; // Default moderate elasticity
}

/**
 * Calculate confidence in recommendation
 */
function calculateConfidence(factors: PricingFactors): number {
    let confidence = 0.5; // Base confidence

    // More historical data = higher confidence
    // More extreme factors = lower confidence (might be anomaly)

    if (factors.stockPressure > 0.3 && factors.stockPressure < 0.9) {
        confidence += 0.2;
    }

    if (factors.profitMargin > 15) {
        confidence += 0.2; // Room to discount
    }

    if (Math.abs(factors.marketPosition) < 0.3) {
        confidence += 0.1; // Price aligned with market
    }

    return Math.min(confidence, 0.95);
}

/**
 * Get pricing recommendations for all products
 */
export async function getPricingRecommendations(
    categoryId?: string,
    minImpact: number = 10
): Promise<DynamicPriceRecommendation[]> {
    const products = await prisma.product.findMany({
        where: {
            available: true,
            ...(categoryId && categoryId !== 'all' ? { categoryId } : {})
        },
        include: { category: true },
        take: 50 // Limit to avoid overwhelming calculations
    });

    const computed = await mapWithConcurrency(products, 5, async (product) => {
        return calculateOptimalDiscountForProduct(product);
    });

    const recommendations = computed.filter(
        (rec) => Math.abs(rec.recommendedDiscount - rec.currentDiscount) >= minImpact
    );

    // Sort by urgency (high stock pressure + old products first)
    return recommendations.sort((a, b) =>
        (b.recommendedDiscount - b.currentDiscount) - (a.recommendedDiscount - a.currentDiscount)
    );
}

/**
 * Apply recommended pricing to product
 */
export async function applyPricingRecommendation(
    productId: string,
    discountPercentage: number
): Promise<void> {
    await prisma.product.update({
        where: { id: productId },
        data: { discountPercentage: Math.round(discountPercentage) }
    });
}
