// FILE: lib/search.ts
// DESCRIPTION: Advanced search utilities with full-text search and ranking

import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export interface SearchOptions {
    query: string;
    categoryId?: string;
    supplierId?: string;
    minPrice?: number;
    maxPrice?: number;
    available?: boolean;
    page?: number;
    limit?: number;
    sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'newest';
}

export interface SearchProduct {
    id: string;
    name: string;
    description: string | null;
    price: number;
    consumerPrice: number | null;
    image: string | null;
    available: boolean;
    discountPercentage: number;
    unit: string;
    stock: number;
    isFeatured: boolean;
    createdAt: Date;
    updatedAt: Date;
    categoryId: string;
    supplierId: string;
    distributorId: string;
    category: {
        id: string;
        name: string | null;
        icon: string | null;
        image: string | null;
    };
    supplier: {
        id: string;
        name: string | null;
        logo: string | null;
    };
    distributor: {
        id: string;
        name: string | null;
        logo: string | null;
    };
    relevanceScore?: number;
    similarityScore?: number;
}

export interface SearchResult {
    products: SearchProduct[];
    total: number;
    page: number;
    totalPages: number;
    suggestions?: string[];
}

/**
 * Advanced product search with full-text search and ranking
 */
export async function searchProducts(options: SearchOptions): Promise<SearchResult> {
    const {
        query,
        categoryId,
        supplierId,
        minPrice,
        maxPrice,
        available = true,
        page = 1,
        limit = 12,
        sortBy = 'relevance'
    } = options;

    const skip = (page - 1) * limit;

    // Build WHERE clause
    const where: Prisma.ProductWhereInput = { available };

    if (categoryId && categoryId !== 'all') {
        where.categoryId = categoryId;
    }

    if (supplierId && supplierId !== 'all') {
        where.supplierId = supplierId;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
        where.price = {};
        if (minPrice !== undefined) where.price.gte = minPrice;
        if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    // Full-text search
    if (query && query.trim()) {
        const searchQuery = query.trim();

        // Use raw SQL for full-text search with ranking
        type SearchProductRow = {
            id: string;
            name: string;
            description: string | null;
            price: number;
            consumerPrice: number | null;
            image: string | null;
            available: boolean;
            discountPercentage: number;
            unit: string;
            stock: number;
            isFeatured: boolean;
            createdAt: Date;
            updatedAt: Date;
            categoryId: string;
            supplierId: string;
            distributorId: string;
            categoryName: string | null;
            categoryIcon: string | null;
            categoryImage: string | null;
            supplierName: string | null;
            supplierLogo: string | null;
            distributorName: string | null;
            distributorLogo: string | null;
            rank: number;
            name_similarity: number;
        };

        const products = await prisma.$queryRaw<SearchProductRow[]>`
      SELECT 
        p.*,
        c.name as "categoryName",
        c.icon as "categoryIcon",
        c.image as "categoryImage",
        s.name as "supplierName",
        s.logo as "supplierLogo",
        d.name as "distributorName",
        d.logo as "distributorLogo",
        ts_rank(p.search_vector, query) as rank,
        similarity(p.name, ${searchQuery}) as name_similarity
      FROM "Product" p
      LEFT JOIN "Category" c ON p."categoryId" = c.id
      LEFT JOIN "Supplier" s ON p."supplierId" = s.id
      LEFT JOIN "Distributor" d ON p."distributorId" = d.id,
      plainto_tsquery('simple', ${searchQuery}) as query
      WHERE 
        p.available = ${available}
        AND (
          p.search_vector @@ query
          OR similarity(p.name, ${searchQuery}) > 0.2
          OR p.name ILIKE ${`%${searchQuery}%`}
        )
        ${categoryId && categoryId !== 'all' ? Prisma.sql`AND p."categoryId" = ${categoryId}` : Prisma.empty}
        ${supplierId && supplierId !== 'all' ? Prisma.sql`AND p."supplierId" = ${supplierId}` : Prisma.empty}
        ${minPrice !== undefined ? Prisma.sql`AND p.price >= ${minPrice}` : Prisma.empty}
        ${maxPrice !== undefined ? Prisma.sql`AND p.price <= ${maxPrice}` : Prisma.empty}
      ORDER BY
        ${sortBy === 'relevance' ? Prisma.sql`rank DESC, name_similarity DESC` : Prisma.empty}
        ${sortBy === 'price_asc' ? Prisma.sql`p.price ASC` : Prisma.empty}
        ${sortBy === 'price_desc' ? Prisma.sql`p.price DESC` : Prisma.empty}
        ${sortBy === 'newest' ? Prisma.sql`p."createdAt" DESC` : Prisma.empty}
      LIMIT ${limit}
      OFFSET ${skip}
    `;

        // Count total results
        const countResult = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count
      FROM "Product" p,
      plainto_tsquery('simple', ${searchQuery}) as query
      WHERE 
        p.available = ${available}
        AND (
          p.search_vector @@ query
          OR similarity(p.name, ${searchQuery}) > 0.2
          OR p.name ILIKE ${`%${searchQuery}%`}
        )
        ${categoryId && categoryId !== 'all' ? Prisma.sql`AND p."categoryId" = ${categoryId}` : Prisma.empty}
        ${supplierId && supplierId !== 'all' ? Prisma.sql`AND p."supplierId" = ${supplierId}` : Prisma.empty}
        ${minPrice !== undefined ? Prisma.sql`AND p.price >= ${minPrice}` : Prisma.empty}
        ${maxPrice !== undefined ? Prisma.sql`AND p.price <= ${maxPrice}` : Prisma.empty}
    `;

        const total = Number(countResult[0].count);

        // Format products with relations
        const formattedProducts = products.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price: p.price,
            consumerPrice: p.consumerPrice,
            image: p.image,
            available: p.available,
            discountPercentage: p.discountPercentage,
            unit: p.unit,
            stock: p.stock,
            isFeatured: p.isFeatured,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
            categoryId: p.categoryId,
            supplierId: p.supplierId,
            distributorId: p.distributorId,
            category: {
                id: p.categoryId,
                name: p.categoryName,
                icon: p.categoryIcon,
                image: p.categoryImage
            },
            supplier: {
                id: p.supplierId,
                name: p.supplierName,
                logo: p.supplierLogo
            },
            distributor: {
                id: p.distributorId,
                name: p.distributorName,
                logo: p.distributorLogo
            },
            relevanceScore: p.rank,
            similarityScore: p.name_similarity
        }));

        return {
            products: formattedProducts,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            suggestions: total === 0 ? await getSearchSuggestions(searchQuery) : undefined
        };
    }

    // No search query - regular listing
    const [products, total] = await prisma.$transaction([
        prisma.product.findMany({
            where,
            include: {
                category: true,
                supplier: true,
                distributor: true
            },
            orderBy: sortBy === 'newest' ? { createdAt: 'desc' } :
                sortBy === 'price_asc' ? { price: 'asc' } :
                    sortBy === 'price_desc' ? { price: 'desc' } :
                        { createdAt: 'desc' },
            skip,
            take: limit
        }),
        prisma.product.count({ where })
    ]);

    return {
        products,
        total,
        page,
        totalPages: Math.ceil(total / limit)
    };
}

/**
 * Get search suggestions when no results found
 */
async function getSearchSuggestions(query: string): Promise<string[]> {
    // Find similar product names using trigram similarity
    const similar = await prisma.$queryRaw<Array<{ name: string; similarity: number }>>`
    SELECT DISTINCT name, similarity(name, ${query}) as similarity
    FROM "Product"
    WHERE similarity(name, ${query}) > 0.15
    ORDER BY similarity DESC
    LIMIT 5
  `;

    return similar.map(s => s.name);
}

/**
 * Get popular search terms (for autocomplete)
 */
export async function getPopularSearchTerms(limit: number = 10): Promise<string[]> {
    // This would typically come from a search_logs table
    // For now, return popular product names
    const popular = await prisma.product.findMany({
        where: { available: true },
        orderBy: { isFeatured: 'desc' },
        select: { name: true },
        take: limit
    });

    return popular.map(p => p.name);
}

/**
 * Log search query for analytics
 */
export async function logSearch(query: string, userId?: string, resultCount?: number): Promise<void> {
    // TODO: Implement search logging to database or analytics service
    // For now, just console log
    console.log('Search:', {
        query,
        userId,
        resultCount,
        timestamp: new Date()
    });
}

/**
 * Get search analytics
 */
export async function getSearchAnalytics(days: number = 7) {
    void days;
    // TODO: Implement when search logging is in place
    // Would return: top searches, zero-result searches, avg results per search
    return {
        topSearches: [],
        zeroResultSearches: [],
        totalSearches: 0,
        averageResults: 0
    };
}
