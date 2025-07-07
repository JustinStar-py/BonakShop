// FILE: app/api/products/[id]/route.ts
// FINAL VERSION: Handles discountPercentage in PUT requests.
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

// --- This function handles UPDATING a full product record ---
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    const productId = params.id;
    const body = await req.json();
    const { name, price, description, image, categoryId, available, discountPercentage } = body;

    if (!name || price === undefined || !categoryId) {
        return NextResponse.json({ error: "Name, price, and category are required" }, { status: 400 });
    }

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        name,
        price: parseFloat(price),
        description,
        image,
        categoryId,
        available,
        discountPercentage: parseInt(discountPercentage, 10) || 0 // Save the discount
      },
    });

    return NextResponse.json(updatedProduct, { status: 200 });

  } catch (error) {
    console.error("Product update error:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

// --- This function handles PARTIALLY updating a product ---
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    const productId = params.id;
    const body = await req.json();

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: body,
    });

    return NextResponse.json(updatedProduct, { status: 200 });

  } catch (error) {
    console.error("Product patch error:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}