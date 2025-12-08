// FILE: app/api/admin/pricing/route.ts
// DESCRIPTION: Dynamic pricing API for admin

import { NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/auth';
import { getPricingRecommendations, calculateOptimalDiscount, applyPricingRecommendation } from '@/lib/pricing';

export async function GET(request: Request) {
    const auth = await getAuthUserFromRequest(request);
    if (!auth || auth.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const categoryId = searchParams.get('categoryId') || undefined;
        const productId = searchParams.get('productId');
        const minImpact = parseInt(searchParams.get('minImpact') || '10');

        if (productId) {
            // Get recommendation for single product
            const recommendation = await calculateOptimalDiscount(productId);
            return NextResponse.json(recommendation);
        }

        // Get recommendations for all products
        const recommendations = await getPricingRecommendations(categoryId, minImpact);
        return NextResponse.json(recommendations);
    } catch (error) {
        console.error('Pricing error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    const auth = await getAuthUserFromRequest(request);
    if (!auth || auth.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { productId, discountPercentage } = body;

        if (!productId || discountPercentage === undefined) {
            return NextResponse.json(
                { error: 'Missing productId or discountPercentage' },
                { status: 400 }
            );
        }

        await applyPricingRecommendation(productId, discountPercentage);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Apply pricing error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
