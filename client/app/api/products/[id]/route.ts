// FILE: app/api/products/[id]/route.ts
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
    // Security check: Only admins can update products
    if (!session.isLoggedIn || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    const productId = params.id;
    const body = await req.json();
    const { name, price, description, image, categoryId, available } = body;

    // Validate required fields
    if (!name || !price || !categoryId) {
        return NextResponse.json({ error: "Name, price, and category are required" }, { status: 400 });
    }

    // Update the product in the database with all provided fields
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        name,
        price: parseFloat(price),
        description,
        image,
        categoryId,
        available
      },
    });

    return NextResponse.json(updatedProduct, { status: 200 });

  } catch (error) {
    console.error("Product update error:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

// --- This function handles PARTIALLY updating a product (e.g., just the availability status) ---
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    // Security check: Only admins can perform partial updates
    if (!session.isLoggedIn || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    const productId = params.id;
    const body = await req.json();

    // Update only the fields that are sent in the request body
    // This makes it flexible for updating just 'available' or any other single field
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
