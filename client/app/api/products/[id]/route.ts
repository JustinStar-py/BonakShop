// FILE: app/api/products/[id]/route.ts
// FINAL VERSION: Handles discountPercentage in PUT requests.
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUserFromRequest } from "@/lib/auth";
import { revalidateTag } from "next/cache";
import { cacheKeys, getCached, invalidateCache } from "@/lib/redis";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const cacheKey = cacheKeys.products.detail(productId);
    const product = await getCached(
      cacheKey,
      () =>
        prisma.product.findUnique({
          where: { id: productId },
          include: {
            category: true, // Include related category
            supplier: true,   // Include related supplier
          },
        }),
      300
    );

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch product:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// --- This function handles UPDATING a full product record ---
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: productId } = await params;
  try {
    const auth = await getAuthUserFromRequest(req);
    if (!auth || auth.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const {
      name, price, description, image, categoryId, available,
      discountPercentage, unit, stock, supplierId, distributorId,
      isFeatured, consumerPrice
    } = body;

    if (!name || price === undefined || !categoryId || !unit || stock === undefined || !supplierId || !distributorId) {
      return NextResponse.json({ error: "Required fields are missing" }, { status: 400 });
    }

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        name,
        price: parseFloat(price),
        description,
        image,
        categoryId,
        supplierId,
        distributorId,
        available,
        discountPercentage: parseInt(discountPercentage, 10) || 0,
        unit,
        stock: Number(stock),
        isFeatured: Boolean(isFeatured),
        consumerPrice: consumerPrice ? parseFloat(consumerPrice) : null,
      },
    });

    revalidateTag('products');
    await invalidateCache(cacheKeys.products.detail(productId));
    await invalidateCache('products:list:*');
    await invalidateCache('products:lists:*');
    await invalidateCache('search:products:*');
    await invalidateCache('categories:*');
    await invalidateCache('suppliers:*');
    return NextResponse.json(updatedProduct, { status: 200 });
  } catch (error) {
    console.error("Product update error:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

// --- This function handles PARTIALLY updating a product ---
export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const productId = params.id;

  try {
    const auth = await getAuthUserFromRequest(req as Request);
    if (!auth || auth.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    const body = await req.json();

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: body,
    });

    revalidateTag('products');
    await invalidateCache(cacheKeys.products.detail(productId));
    await invalidateCache('products:list:*');
    await invalidateCache('products:lists:*');
    await invalidateCache('search:products:*');
    await invalidateCache('categories:*');
    await invalidateCache('suppliers:*');
    return NextResponse.json(updatedProduct, { status: 200 });

  } catch (error) {
    console.error("Product patch error:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

// DELETE a product (Admin only)
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const productId = params.id;

  try {
    const auth = await getAuthUserFromRequest(req as Request);
    if (!auth || auth.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await prisma.product.delete({ where: { id: productId } });
    
    revalidateTag('products');
    revalidateTag('categories'); // Update category counts
    revalidateTag('suppliers'); // Update supplier counts (if tracked)
    await invalidateCache(cacheKeys.products.detail(productId));
    await invalidateCache('products:list:*');
    await invalidateCache('products:lists:*');
    await invalidateCache('search:products:*');
    await invalidateCache('categories:*');
    await invalidateCache('suppliers:*');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Product delete error:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
