// FILE: app/api/categories/route.ts (Complete and with Caching)
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import cache from 'memory-cache';

const CACHE_KEY = 'categories_cache';
const CACHE_DURATION = 1000 * 60 * 60; 

// --- GET all categories ---
export async function GET() {
  try {
    const cachedCategories = cache.get(CACHE_KEY);
    if (cachedCategories) {
      console.log('Serving categories from cache');
      return NextResponse.json(cachedCategories, { status: 200 });
    }

    console.log('Fetching categories from database');
    const categories = await prisma.category.findMany({
        orderBy: { name: 'asc' }
    });

    cache.put(CACHE_KEY, categories, CACHE_DURATION);

    return NextResponse.json(categories, { status: 200 });

  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

// --- POST a new category (Admin only) ---
export async function POST(req: Request) {
  try {
    // منطق این بخش از کد قبلی شما بدون تغییر باقی می‌ماند
    const body = await req.json();
    const { name, icon, image } = body;

    if (!name) {
        return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    const newCategory = await prisma.category.create({
        data: { name, icon, image }
    });

    cache.del(CACHE_KEY);

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error("Failed to create category:", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}