import { unstable_cache } from 'next/cache';
import prisma from '@/lib/prisma';

// 1. Products Cache
// Revalidates every 1 min (60s) OR when 'products' tag is invalidated
export const getCachedProducts = unstable_cache(
  async (queryOptions: any) => {
    return await prisma.product.findMany(queryOptions);
  },
  ['products-list'], 
  { revalidate: 60, tags: ['products'] }
);

export const getCachedProductCount = unstable_cache(
  async (where: any) => {
    return await prisma.product.count({ where });
  },
  ['products-count'],
  { revalidate: 60, tags: ['products'] }
);

// 2. Categories Cache
// Revalidates every 1 hours (3600s) OR when 'categories' tag is invalidated
export const getCachedCategories = unstable_cache(
  async () => {
    return await prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { name: "asc" },
    });
  },
  ['categories-list'],
  { revalidate: 3600, tags: ['categories'] }
);

// 3. Suppliers Cache
export const getCachedSuppliers = unstable_cache(
  async () => {
    return await prisma.supplier.findMany({
      orderBy: { name: "asc" },
    });
  },
  ['suppliers-list'],
  { revalidate: 3600, tags: ['suppliers'] }
);
