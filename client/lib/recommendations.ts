// FILE: lib/recommendations.ts
// DESCRIPTION: Product recommendation engine using collaborative and content-based filtering

import prisma from '@/lib/prisma';

interface RecommendationScore {
    productId: string;
    score: number;
    reason: string;
}

/**
 * Get personalized product recommendations for a user
 * @param userId - User ID to get recommendations for
 * @param limit - Number of recommendations to return
 * @returns Array of recommended products with scores
 */
export async function getPersonalizedRecommendations(
    userId: string,
    limit: number = 10
): Promise<RecommendationScore[]> {
    // 1. Get user's purchase history
    const userOrders = await prisma.order.findMany({
        where: { userId },
        include: {
            items: {
                include: {
                    product: {
                        include: {
                            category: true,
                            supplier: true
                        }
                    }
                }
            }
        },
        orderBy: { createdAt: 'desc' },
        take: 20 // Last 20 orders
    });

    if (userOrders.length === 0) {
        // New user - return popular/featured products
        return await getPopularProducts(limit);
    }

    // 2. Extract purchased products
    const purchasedProductIds = new Set<string>();
    const categoryPreferences = new Map<string, number>();
    const supplierPreferences = new Map<string, number>();

    userOrders.forEach(order => {
        order.items.forEach(item => {
            purchasedProductIds.add(item.productId);

            // Track category preferences
            const catId = item.product.categoryId;
            categoryPreferences.set(catId, (categoryPreferences.get(catId) || 0) + item.quantity);

            // Track supplier preferences
            const suppId = item.product.supplierId;
            supplierPreferences.set(suppId, (supplierPreferences.get(suppId) || 0) + item.quantity);
        });
    });

    // 3. Find similar users (collaborative filtering)
    const similarUserIds = await findSimilarUsers(userId, Array.from(purchasedProductIds));

    // 4. Get products bought by similar users
    const collaborativeProducts = await getProductsFromSimilarUsers(
        similarUserIds,
        purchasedProductIds
    );

    // 5. Content-based recommendations
    const contentProducts = await getContentBasedRecommendations(
        categoryPreferences,
        supplierPreferences,
        purchasedProductIds
    );

    // 6. Merge and score recommendations
    const recommendations = mergeRecommendations(
        collaborativeProducts,
        contentProducts,
        limit
    );

    return recommendations;
}

/**
 * Find users with similar purchase patterns
 */
async function findSimilarUsers(
    userId: string,
    purchasedProductIds: string[]
): Promise<string[]> {
    if (purchasedProductIds.length === 0) return [];

    // Find users who bought the same products
    const similarOrders = await prisma.order.findMany({
        where: {
            userId: { not: userId },
            items: {
                some: {
                    productId: { in: purchasedProductIds }
                }
            }
        },
        select: {
            userId: true,
            items: {
                select: { productId: true }
            }
        },
        take: 50
    });

    // Calculate similarity scores (Jaccard similarity)
    const userScores = new Map<string, number>();
    const purchasedSet = new Set(purchasedProductIds);

    similarOrders.forEach(order => {
        const otherProducts = new Set(order.items.map(i => i.productId));

        let intersectionSize = 0;
        for (const productId of otherProducts) {
            if (purchasedSet.has(productId)) intersectionSize += 1;
        }

        const unionSize = purchasedSet.size + otherProducts.size - intersectionSize;
        const similarity = unionSize === 0 ? 0 : intersectionSize / unionSize;

        userScores.set(
            order.userId,
            Math.max(userScores.get(order.userId) || 0, similarity)
        );
    });

    // Return top 10 similar users
    return Array.from(userScores.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([userId]) => userId);
}

/**
 * Get products bought by similar users
 */
async function getProductsFromSimilarUsers(
    userIds: string[],
    excludeIds: Set<string>
): Promise<Map<string, number>> {
    if (userIds.length === 0) return new Map();

    const products = await prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
            order: {
                userId: { in: userIds }
            },
            productId: { notIn: Array.from(excludeIds) }
        },
        _count: {
            productId: true
        },
        orderBy: {
            _count: {
                productId: 'desc'
            }
        },
        take: 20
    });

    const scores = new Map<string, number>();
    products.forEach(p => {
        scores.set(p.productId, p._count.productId);
    });

    return scores;
}

/**
 * Get content-based recommendations based on user preferences
 */
async function getContentBasedRecommendations(
    categoryPreferences: Map<string, number>,
    supplierPreferences: Map<string, number>,
    excludeIds: Set<string>
): Promise<Map<string, number>> {
    const topCategories = Array.from(categoryPreferences.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([id]) => id);

    const topSuppliers = Array.from(supplierPreferences.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([id]) => id);

    if (topCategories.length === 0) return new Map();

    const products = await prisma.product.findMany({
        where: {
            AND: [
                { available: true },
                { id: { notIn: Array.from(excludeIds) } },
                {
                    OR: [
                        { categoryId: { in: topCategories } },
                        { supplierId: { in: topSuppliers } }
                    ]
                }
            ]
        },
        select: {
            id: true,
            categoryId: true,
            supplierId: true,
            isFeatured: true,
            createdAt: true
        },
        take: 30
    });

    // Score products based on preferences
    const scores = new Map<string, number>();
    products.forEach(product => {
        let score = 0;

        // Category match
        const catScore = categoryPreferences.get(product.categoryId) || 0;
        score += catScore * 0.4;

        // Supplier match
        const suppScore = supplierPreferences.get(product.supplierId) || 0;
        score += suppScore * 0.3;

        // Featured bonus
        if (product.isFeatured) {
            score += 10;
        }

        // Recency bonus (newer products get a boost)
        const ageInDays = (Date.now() - product.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        if (ageInDays < 7) {
            score += 5;
        }

        scores.set(product.id, score);
    });

    return scores;
}

/**
 * Merge collaborative and content-based scores
 */
function mergeRecommendations(
    collaborative: Map<string, number>,
    content: Map<string, number>,
    limit: number
): RecommendationScore[] {
    const merged = new Map<string, { score: number; reason: string }>();

    // Add collaborative scores (weight: 0.6)
    collaborative.forEach((score, productId) => {
        merged.set(productId, {
            score: score * 0.6,
            reason: 'users_also_bought'
        });
    });

    // Add content scores (weight: 0.4)
    content.forEach((score, productId) => {
        const existing = merged.get(productId);
        if (existing) {
            existing.score += score * 0.4;
            existing.reason = 'similar_and_popular';
        } else {
            merged.set(productId, {
                score: score * 0.4,
                reason: 'similar_to_purchases'
            });
        }
    });

    // Sort and return top recommendations
    return Array.from(merged.entries())
        .map(([productId, { score, reason }]) => ({
            productId,
            score,
            reason
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
}

/**
 * Get popular products for new users
 */
async function getPopularProducts(limit: number): Promise<RecommendationScore[]> {
    const popularProducts = await prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
            product: {
                available: true
            }
        },
        _count: {
            productId: true
        },
        orderBy: {
            _count: {
                productId: 'desc'
            }
        },
        take: limit
    });

    return popularProducts.map((p, index) => ({
        productId: p.productId,
        score: limit - index,
        reason: 'popular'
    }));
}

/**
 * Get product recommendations based on cart contents
 */
export async function getCartRecommendations(
    productIds: string[],
    limit: number = 5
): Promise<RecommendationScore[]> {
    if (productIds.length === 0) return [];

    // Find products frequently bought together
    const relatedProducts = await prisma.orderItem.findMany({
        where: {
            order: {
                items: {
                    some: {
                        productId: { in: productIds }
                    }
                }
            },
            productId: { notIn: productIds },
            product: {
                available: true
            }
        },
        select: {
            productId: true,
            product: {
                select: {
                    id: true,
                    categoryId: true
                }
            }
        },
        take: 100
    });

    // Count frequency
    const frequency = new Map<string, number>();
    relatedProducts.forEach(item => {
        frequency.set(item.productId, (frequency.get(item.productId) || 0) + 1);
    });

    return Array.from(frequency.entries())
        .map(([productId, count]) => ({
            productId,
            score: count,
            reason: 'frequently_bought_together'
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
}
