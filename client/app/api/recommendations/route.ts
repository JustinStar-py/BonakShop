// FILE: app/api/recommendations/route.ts
// DESCRIPTION: API endpoint for getting personalized product recommendations

import { NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/auth';
import { getPersonalizedRecommendations, getCartRecommendations } from '@/lib/recommendations';
import { checkRateLimit, getClientIdentifier } from '@/lib/rateLimit';
import prisma from '@/lib/prisma';
import { cacheKeys, getCached } from '@/lib/redis';

export async function GET(request: Request) {
    // Rate limiting
    const identifier = getClientIdentifier(request);
    const rateCheck = await checkRateLimit(identifier, {
        windowMs: 60 * 1000, // 1 minute
        max: 30,
        message: 'تعداد درخواست‌های شما برای دریافت پیشنهادات بیش از حد است'
    });

    if (!rateCheck.allowed) {
        return rateCheck.response!;
    }

    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || 'personalized';
        const limit = parseInt(searchParams.get('limit') || '10');

        if (type === 'cart') {
            // Get cart-based recommendations
            const productIds = searchParams.get('productIds')?.split(',') || [];
            const normalizedIds = productIds.filter(Boolean).sort();
            const cacheKey = cacheKeys.recommendations.cart(normalizedIds, limit);
            const sortedProducts = await getCached(
                cacheKey,
                async () => {
                    const recommendations = await getCartRecommendations(productIds, limit);

                    // Fetch full product details
                    const products = await prisma.product.findMany({
                        where: {
                            id: { in: recommendations.map(r => r.productId) }
                        },
                        include: {
                            category: true,
                            supplier: true,
                            distributor: true
                        }
                    });

                    // Sort by recommendation score
                    return recommendations
                        .map(rec => ({
                            ...products.find(p => p.id === rec.productId)!,
                            recommendationScore: rec.score,
                            recommendationReason: rec.reason
                        }))
                        .filter(p => p);
                },
                120
            );

            return NextResponse.json(sortedProducts);
        }

        // Personalized recommendations (requires authentication)
        const auth = await getAuthUserFromRequest(request);
        if (!auth || !auth.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const cacheKey = cacheKeys.recommendations.user(auth.user.id, limit);
        const sortedProducts = await getCached(
            cacheKey,
            async () => {
                const recommendations = await getPersonalizedRecommendations(auth.user.id, limit);

                // Fetch full product details
                const products = await prisma.product.findMany({
                    where: {
                        id: { in: recommendations.map(r => r.productId) }
                    },
                    include: {
                        category: true,
                        supplier: true,
                        distributor: true
                    }
                });

                // Sort by recommendation score and add reason
                return recommendations
                    .map(rec => ({
                        ...products.find(p => p.id === rec.productId)!,
                        recommendationScore: rec.score,
                        recommendationReason: rec.reason
                    }))
                    .filter(p => p);
            },
            120
        );

        return NextResponse.json(sortedProducts);
    } catch (error) {
        console.error('Recommendations error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
