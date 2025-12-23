// FILE: app/api/search/route.ts
// DESCRIPTION: Advanced search API endpoint

import { NextResponse } from 'next/server';
import { searchProducts } from '@/lib/search';
import { checkRateLimit, getClientIdentifier } from '@/lib/rateLimit';
import { cacheKeys, getCached } from '@/lib/redis';

export async function GET(request: Request) {
    // Rate limiting
    const identifier = getClientIdentifier(request);
    const rateCheck = await checkRateLimit(identifier, {
        windowMs: 60 * 1000, // 1 minute
        max: 60, // 60 searches per minute
    });

    if (!rateCheck.allowed) {
        return rateCheck.response!;
    }

    try {
        const { searchParams } = new URL(request.url);

        const options = {
            query: searchParams.get('q') || searchParams.get('query') || '',
            categoryId: searchParams.get('categoryId') || undefined,
            supplierId: searchParams.get('supplierId') || undefined,
            minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
            maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
            available: searchParams.get('available') !== 'false',
            page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
            limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 12,
            sortBy: (searchParams.get('sortBy') as any) || 'relevance'
        };

        const cacheKey = cacheKeys.search.products(options);
        const results = await getCached(cacheKey, () => searchProducts(options), 60);

        return NextResponse.json(results);
    } catch (error) {
        console.error('Search error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
