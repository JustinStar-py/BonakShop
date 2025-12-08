// FILE: lib/analytics.ts
// DESCRIPTION: Analytics and demand forecasting utilities

import prisma from '@/lib/prisma';

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
        include: {
            order: {
                select: { createdAt: true }
            }
        }
    });

    // Group by date
    const dailySales = new Map<string, { quantity: number; revenue: number }>();

    sales.forEach(item => {
        const dateKey = item.order.createdAt.toISOString().split('T')[0];
        const existing = dailySales.get(dateKey) || { quantity: 0, revenue: 0 };

        dailySales.set(dateKey, {
            quantity: existing.quantity + item.quantity,
            revenue: existing.revenue + (item.price * item.quantity)
        });
    });

    return Array.from(dailySales.entries()).map(([dateStr, data]) => ({
        date: new Date(dateStr),
        quantity: data.quantity,
        revenue: data.revenue
    }));
}

/**
 * Calculate demand forecast for a product using exponential smoothing
 */
export async function forecastProductDemand(
    productId: string,
    daysAhead: number = 7
): Promise<number> {
    const salesHistory = await getProductSalesHistory(productId, 90);

    if (salesHistory.length === 0) {
        return 0;
    }

    // Calculate average daily sales
    const totalQuantity = salesHistory.reduce((sum, day) => sum + day.quantity, 0);
    const averageDailySales = totalQuantity / salesHistory.length;

    // Simple exponential smoothing
    const alpha = 0.3; // Smoothing factor
    let forecast = averageDailySales;

    salesHistory.forEach(day => {
        forecast = alpha * day.quantity + (1 - alpha) * forecast;
    });

    // Apply trend if present
    const recentSales = salesHistory.slice(-7);
    const olderSales = salesHistory.slice(0, 7);

    if (recentSales.length > 0 && olderSales.length > 0) {
        const recentAvg = recentSales.reduce((sum, d) => sum + d.quantity, 0) / recentSales.length;
        const olderAvg = olderSales.reduce((sum, d) => sum + d.quantity, 0) / olderSales.length;
        const trend = (recentAvg - olderAvg) / olderAvg;

        // Apply trend with dampening
        forecast = forecast * (1 + trend * 0.3);
    }

    // Multiply by days ahead
    return Math.ceil(forecast * daysAhead);
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

    const recommendations: DemandForecast[] = [];

    for (const product of products) {
        const salesHistory = await getProductSalesHistory(product.id, 30);

        if (salesHistory.length === 0) continue;

        const totalSales = salesHistory.reduce((sum, day) => sum + day.quantity, 0);
        const averageDailySales = totalSales / salesHistory.length;
        const forecastedDemand = await forecastProductDemand(product.id, 7);

        const daysOfStock = averageDailySales > 0
            ? product.stock / averageDailySales
            : 999;

        let urgency: 'low' | 'medium' | 'high' | 'critical' = 'low';
        if (daysOfStock < 3) urgency = 'critical';
        else if (daysOfStock < 7) urgency = 'high';
        else if (daysOfStock < 14) urgency = 'medium';

        const recommendedReorder = Math.max(0, forecastedDemand - product.stock);

        if (daysOfStock < 14 || recommendedReorder > 0) {
            recommendations.push({
                productId: product.id,
                productName: product.name,
                currentStock: product.stock,
                averageDailySales,
                forecastedDemand,
                daysOfStockRemaining: Math.round(daysOfStock),
                recommendedReorder,
                urgency
            });
        }
    }

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
    const rfmData = users.map(user => {
        if (user.orders.length === 0) {
            return null;
        }

        const lastOrder = user.orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
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
    }).filter(Boolean) as any[];

    if (rfmData.length === 0) {
        return [];
    }

    // Calculate quintiles for scoring
    const recencies = rfmData.map(d => d.recency).sort((a, b) => a - b);
    const frequencies = rfmData.map(d => d.frequency).sort((a, b) => a - b);
    const monetaries = rfmData.map(d => d.monetary).sort((a, b) => a - b);

    const getQuintile = (value: number, arr: number[], inverse: boolean = false) => {
        const index = arr.findIndex(v => v >= value);
        const percentile = index / arr.length;
        const score = Math.ceil(percentile * 5);
        return inverse ? 6 - score : score;
    };

    const segments = rfmData.map(data => {
        const recencyScore = getQuintile(data.recency, recencies, true); // Lower is better
        const frequencyScore = getQuintile(data.frequency, frequencies);
        const monetaryScore = getQuintile(data.monetary, monetaries);
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
