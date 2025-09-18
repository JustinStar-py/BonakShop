// FILE: app/api/categories/[id]/route.ts (CORRECTED)
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import cache from 'memory-cache';

// The cache key must be identical to the one in the main categories route.
const CACHE_KEY = 'categories_cache';

// --- FIX 1: The function signature is updated to correctly handle route parameters ---
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    const categoryId = params.id;
    const body = await req.json();
    const { name, icon, image } = body;

    if (!name) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: { name, icon, image },
    });
    
    // --- FIX 2: Invalidate the cache after a successful update ---
    cache.del(CACHE_KEY);
    
    return NextResponse.json(updatedCategory, { status: 200 });

  } catch (error) {
    console.error("Category update error:", error);
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}

// --- FIX 1: The function signature is updated here as well ---
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const categoryId = params.id;
    await prisma.category.delete({ where: { id: categoryId } });
    
    // --- FIX 2: Invalidate the cache after a successful deletion ---
    cache.del(CACHE_KEY);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Category delete error:", error);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
