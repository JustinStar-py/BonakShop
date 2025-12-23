// FILE: app/api/admin/analytics/route.ts
// DESCRIPTION: Admin analytics endpoints

import { NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/auth';
import { getSalesAnalytics, calculateRFMSegments, getInventoryRecommendations } from '@/lib/analytics';
import { checkRateLimit, getClientIdentifier } from '@/lib/rateLimit';

export async function GET(request: Request) {
    // Authentication check
    const auth = await getAuthUserFromRequest(request);
    if (!auth || auth.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Rate limiting
    const identifier = getClientIdentifier(request);
    const rateCheck = await checkRateLimit(identifier, {
        windowMs: 60 * 1000,
        max: 20,
    });

    if (!rateCheck.allowed) {
        return rateCheck.response!;
    }

    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || 'sales';
        const days = parseInt(searchParams.get('days') || '30');

        switch (type) {
            case 'sales':
                const salesData = await getSalesAnalytics(days);
                return NextResponse.json(salesData);

            case 'customers':
                const rfmSegments = await calculateRFMSegments();
                return NextResponse.json(rfmSegments);

            case 'inventory':
                const inventoryRecs = await getInventoryRecommendations();
                return NextResponse.json(inventoryRecs);

            default:
                return NextResponse.json(
                    { error: 'Invalid analytics type' },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error('Analytics error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
