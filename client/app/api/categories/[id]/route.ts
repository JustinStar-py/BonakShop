// FILE: app/api/categories/[id]/route.ts (CORRECTED)
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUserFromRequest } from "@/lib/auth";
import { revalidateTag } from "next/cache";
import { invalidateCache } from "@/lib/redis";

// --- FIX 1: The function signature is updated to correctly handle route parameters ---
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUserFromRequest(req as Request);
    if (!auth || auth.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: categoryId } = await params;
    const body = await req.json();
    const { name, icon, image } = body;

    if (!name) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: { name, icon, image },
    });

    // --- FIX 2: Invalidate the Next.js cache ---
    revalidateTag('categories', 'max');
    await invalidateCache('categories:*');
    await invalidateCache('products:list:*');
    await invalidateCache('products:lists:*');
    await invalidateCache('products:detail:*');
    await invalidateCache('search:products:*');

    return NextResponse.json(updatedCategory, { status: 200 });

  } catch (error) {
    console.error("Category update error:", error);
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}

// --- FIX 1: The function signature is updated here as well ---
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUserFromRequest(req as Request);
    if (!auth || auth.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id: categoryId } = await params;
    await prisma.category.delete({ where: { id: categoryId } });

    // --- FIX 2: Invalidate the Next.js cache ---
    revalidateTag('categories', 'max');
    await invalidateCache('categories:*');
    await invalidateCache('products:list:*');
    await invalidateCache('products:lists:*');
    await invalidateCache('products:detail:*');
    await invalidateCache('search:products:*');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Category delete error:", error);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
