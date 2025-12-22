// FILE: lib/analytics.ts
// DESCRIPTION: Analytics and demand forecasting utilities

import prisma from '@/lib/prisma';
import { mapWithConcurrency } from './concurrency';

interface SalesData {
    date: Date;
    quantity: number;
    revenue: number;
}

interface DemandForecast {
    productId: string;
    productName: string;
    currentStock: number;
    averageDailySales: number;
    forecastedDemand: number;
    daysOfStockRemaining: number;
    recommendedReorder: number;
    urgency: 'low' | 'medium' | 'high' | 'critical';
}

function toUtcDateKey(date: Date): string {
    return date.toISOString().slice(0, 10);
}

function getUtcStartOfDay(date: Date): Date {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function getRecentUtcDateKeys(days: number, now: Date = new Date()): string[] {
    const end = getUtcStartOfDay(now);
    const keys: string[] = [];

    for (let offset = days - 1; offset >= 0; offset--) {
        const d = new Date(end);
        d.setUTCDate(end.getUTCDate() - offset);
        keys.push(toUtcDateKey(d));
    }

    return keys;
}

function buildQuantityMap(history: SalesData[]): Map<string, number> {
    const map = new Map<string, number>();
    for (const day of history) {
        map.set(toUtcDateKey(day.date), day.quantity);
    }
    return map;
}

function forecastDemandFromHistory(
    history: SalesData[],
    historyDays: number,
    daysAhead: number
): number {
    if (historyDays <= 0 || daysAhead <= 0) return 0;

    const quantityByDay = buildQuantityMap(history);
    const series = getRecentUtcDateKeys(historyDays).map((key) => quantityByDay.get(key) ?? 0);

    const totalQuantity = series.reduce((sum, q) => sum + q, 0);
    const averageDailySales = totalQuantity / historyDays;

    // Simple exponential smoothing
    const alpha = 0.3; // Smoothing factor
    let forecast = averageDailySales;

    for (const quantity of series) {
        forecast = alpha * quantity + (1 - alpha) * forecast;
    }

    // Trend: compare first vs last week in the window (treat missing days as 0)
    const week = Math.min(7, series.length);
    const older = series.slice(0, week);
    const recent = series.slice(series.length - week);

    const olderAvg = older.reduce((sum, q) => sum + q, 0) / week;
    const recentAvg = recent.reduce((sum, q) => sum + q, 0) / week;

    if (olderAvg > 0) {
        const trend = (recentAvg - olderAvg) / olderAvg;
        forecast = forecast * (1 + trend * 0.3); // dampening
    }

    return Math.max(0, Math.ceil(forecast * daysAhead));
}

/**
 * Get sales history for a product
 */
export async function getProductSalesHistory(
    productId: string,
    days: number = 30
): Promise<SalesData[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const sales = await prisma.orderItem.findMany({
        where: {
            productId,
            order: {
                createdAt: { gte: startDate },
                status: { in: ['DELIVERED', 'SHIPPED'] }
            }
        },
        orderBy: {
            order: {
                createdAt: 'asc'
            }
        },
        include: {
            order: {
                select: { createdAt: true }
            }
        }
    });

    // Group by date
    const dailySales = new Map<string, { quantity: number; revenue: number }>();

    sales.forEach(item => {
        const dateKey = toUtcDateKey(item.order.createdAt);
        const existing = dailySales.get(dateKey) || { quantity: 0, revenue: 0 };

        dailySales.set(dateKey, {
            quantity: existing.quantity + item.quantity,
            revenue: existing.revenue + (item.price * item.quantity)
        });
    });

    return Array.from(dailySales.entries())
        .map(([dateStr, data]) => ({
            date: new Date(dateStr),
            quantity: data.quantity,
            revenue: data.revenue
        }))
        .sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Calculate demand forecast for a product using exponential smoothing
 */
export async function forecastProductDemand(
    productId: string,
    daysAhead: number = 7
): Promise<number> {
    const historyDays = 90;
    const salesHistory = await getProductSalesHistory(productId, historyDays);
    if (salesHistory.length === 0) return 0;
    return forecastDemandFromHistory(salesHistory, historyDays, daysAhead);
}

/**
 * Get inventory recommendations for all low-stock products
 */
export async function getInventoryRecommendations(): Promise<DemandForecast[]> {
    const products = await prisma.product.findMany({
        where: {
            available: true
        },
        select: {
            id: true,
            name: true,
            stock: true
        }
    });

    const historyDays = 90;
    const averageDays = 30;
    const daysAhead = 7;

    const computed = await mapWithConcurrency(products, 5, async (product) => {
        const history = await getProductSalesHistory(product.id, historyDays);
        if (history.length === 0) return null;

        const quantityByDay = buildQuantityMap(history);
        const last30 = getRecentUtcDateKeys(averageDays).reduce(
            (sum, key) => sum + (quantityByDay.get(key) ?? 0),
            0
        );
        const averageDailySales = last30 / averageDays;
        const forecastedDemand = forecastDemandFromHistory(history, historyDays, daysAhead);

        const daysOfStock = averageDailySales > 0 ? product.stock / averageDailySales : 999;

        let urgency: 'low' | 'medium' | 'high' | 'critical' = 'low';
        if (daysOfStock < 3) urgency = 'critical';
        else if (daysOfStock < 7) urgency = 'high';
        else if (daysOfStock < 14) urgency = 'medium';

        const recommendedReorder = Math.max(0, forecastedDemand - product.stock);

        if (daysOfStock < 14 || recommendedReorder > 0) {
            return {
                productId: product.id,
                productName: product.name,
                currentStock: product.stock,
                averageDailySales,
                forecastedDemand,
                daysOfStockRemaining: Math.round(daysOfStock),
                recommendedReorder,
                urgency
            } satisfies DemandForecast;
        }

        return null;
    });

    const recommendations = computed.filter((r): r is DemandForecast => r !== null);

    return recommendations.sort((a, b) => {
        const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    });
}

/**
 * Calculate customer RFM (Recency, Frequency, Monetary) scores
 */
export interface RFMSegment {
    userId: string;
    userName: string | null;
    shopName: string | null;
    recencyScore: number; // 1-5 (5 = most recent)
    frequencyScore: number; // 1-5 (5 = most frequent)
    monetaryScore: number; // 1-5 (5 = highest value)
    totalScore: number;
    segment: string;
    lastOrderDate: Date | null;
    totalOrders: number;
    totalSpent: number;
}

export async function calculateRFMSegments(): Promise<RFMSegment[]> {
    const users = await prisma.user.findMany({
        where: {
            role: 'CUSTOMER'
        },
        include: {
            orders: {
                where: {
                    status: { in: ['DELIVERED'] }
                },
                select: {
                    createdAt: true,
                    totalPrice: true
                }
            }
        }
    });

    const now = new Date();

    type RfmRaw = {
        userId: string;
        userName: string | null;
        shopName: string | null;
        recency: number;
        frequency: number;
        monetary: number;
        lastOrderDate: Date;
    };

    const rfmData: RfmRaw[] = users.map((user) => {
        if (user.orders.length === 0) {
            return null;
        }

        const lastOrder = user.orders.reduce((latest, current) => {
            return current.createdAt.getTime() > latest.createdAt.getTime() ? current : latest;
        });
        const recency = Math.floor((now.getTime() - lastOrder.createdAt.getTime()) / (1000 * 60 * 60 * 24));
        const frequency = user.orders.length;
        const monetary = user.orders.reduce((sum, o) => sum + o.totalPrice, 0);

        return {
            userId: user.id,
            userName: user.name,
            shopName: user.shopName,
            recency,
            frequency,
            monetary,
            lastOrderDate: lastOrder.createdAt
        };
    }).filter((d): d is RfmRaw => d !== null);

    if (rfmData.length === 0) {
        return [];
    }

    // Calculate quintiles for scoring
    const recencies = rfmData.map(d => d.recency).sort((a, b) => a - b);
    const frequencies = rfmData.map(d => d.frequency).sort((a, b) => a - b);
    const monetaries = rfmData.map(d => d.monetary).sort((a, b) => a - b);

    const getQuintileThresholds = (arr: number[]) => {
        const n = arr.length;
        const at = (p: number) => arr[Math.floor(p * (n - 1))];
        return [at(0.2), at(0.4), at(0.6), at(0.8)] as const;
    };

    const getQuintileScore = (value: number, thresholds: readonly number[], inverse = false) => {
        let score = 1;
        for (const t of thresholds) {
            if (value > t) score += 1;
        }
        return inverse ? 6 - score : score;
    };

    const recencyThresholds = getQuintileThresholds(recencies);
    const frequencyThresholds = getQuintileThresholds(frequencies);
    const monetaryThresholds = getQuintileThresholds(monetaries);

    const segments = rfmData.map(data => {
        const recencyScore = getQuintileScore(data.recency, recencyThresholds, true); // Lower is better
        const frequencyScore = getQuintileScore(data.frequency, frequencyThresholds);
        const monetaryScore = getQuintileScore(data.monetary, monetaryThresholds);
        const totalScore = recencyScore + frequencyScore + monetaryScore;

        let segment = 'Lost';
        if (totalScore >= 13) segment = 'Champions';
        else if (totalScore >= 10) segment = 'Loyal';
        else if (totalScore >= 7) segment = 'Promising';
        else if (totalScore >= 5) segment = 'At Risk';

        return {
            userId: data.userId,
            userName: data.userName,
            shopName: data.shopName,
            recencyScore,
            frequencyScore,
            monetaryScore,
            totalScore,
            segment,
            lastOrderDate: data.lastOrderDate,
            totalOrders: data.frequency,
            totalSpent: data.monetary
        };
    });

    return segments.sort((a, b) => b.totalScore - a.totalScore);
}

/**
 * Get sales analytics summary
 */
export interface SalesAnalytics {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    topProducts: Array<{
        id: string;
        name: string;
        totalSales: number;
        revenue: number;
    }>;
    revenueByCategory: Array<{
        categoryName: string;
        revenue: number;
    }>;
    ordersByStatus: Record<string, number>;
}

export async function getSalesAnalytics(days: number = 30): Promise<SalesAnalytics> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const orders = await prisma.order.findMany({
        where: {
            createdAt: { gte: startDate }
        },
        include: {
            items: {
                include: {
                    product: {
                        include: {
                            category: true
                        }
                    }
                }
            }
        }
    });

    const totalRevenue = orders.reduce((sum, o) => sum + o.totalPrice, 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Top products
    const productSales = new Map<string, { name: string; quantity: number; revenue: number }>();
    orders.forEach(order => {
        order.items.forEach(item => {
            const existing = productSales.get(item.productId) || {
                name: item.productName,
                quantity: 0,
                revenue: 0
            };
            productSales.set(item.productId, {
                name: item.productName,
                quantity: existing.quantity + item.quantity,
                revenue: existing.revenue + (item.price * item.quantity)
            });
        });
    });

    const topProducts = Array.from(productSales.entries())
        .map(([id, data]) => ({
            id,
            name: data.name,
            totalSales: data.quantity,
            revenue: data.revenue
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

    // Revenue by category
    const categoryRevenue = new Map<string, number>();
    orders.forEach(order => {
        order.items.forEach(item => {
            const catName = item.product.category.name;
            categoryRevenue.set(catName, (categoryRevenue.get(catName) || 0) + (item.price * item.quantity));
        });
    });

    const revenueByCategory = Array.from(categoryRevenue.entries())
        .map(([categoryName, revenue]) => ({ categoryName, revenue }))
        .sort((a, b) => b.revenue - a.revenue);

    // Orders by status
    const ordersByStatus: Record<string, number> = {};
    orders.forEach(order => {
        ordersByStatus[order.status] = (ordersByStatus[order.status] || 0) + 1;
    });

    return {
        totalRevenue,
        totalOrders,
        averageOrderValue,
        topProducts,
        revenueByCategory,
        ordersByStatus
    };
}
