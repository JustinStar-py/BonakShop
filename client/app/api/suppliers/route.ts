// FILE: app/api/suppliers/route.ts (Complete and with Caching)
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import cache from 'memory-cache';

const CACHE_KEY = 'all_suppliers_cache';
const CACHE_DURATION = 1000 * 60 * 60;

// --- GET suppliers ---
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");

    if (categoryId) {
      const products = await prisma.product.findMany({
        where: { categoryId: categoryId },
        select: { supplier: true },
        distinct: ['supplierId'],
      });
      const suppliers = products.map(p => p.supplier);
      return NextResponse.json(suppliers);
    }

    const cachedSuppliers = cache.get(CACHE_KEY);
    if (cachedSuppliers) {
      console.log('Serving all suppliers from cache');
      return NextResponse.json(cachedSuppliers, { status: 200 });
    }

    console.log('Fetching all suppliers from database');
    const allSuppliers = await prisma.supplier.findMany({
        orderBy: { name: 'asc' }
    });

    cache.put(CACHE_KEY, allSuppliers, CACHE_DURATION);

    return NextResponse.json(allSuppliers);
    
  } catch (error) {
    console.error("Failed to fetch suppliers:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// --- POST a new supplier (Admin only) ---
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, logo } = body;

        if (!name) {
            return NextResponse.json({ error: "Supplier name is required" }, { status: 400 });
        }

        const newSupplier = await prisma.supplier.create({
            data: { name, logo }
        });

        cache.del(CACHE_KEY);

        return NextResponse.json(newSupplier, { status: 201 });
    } catch (error) {
        console.error("Failed to create supplier", error);
        return NextResponse.json({ error: "Failed to create supplier" }, { status: 500 });
    }
}