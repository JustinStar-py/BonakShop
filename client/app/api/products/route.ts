// FILE: app/api/products/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

// GET all products
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: { category: true },
    });
    return NextResponse.json(products, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

// POST a new product (Admin only)
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { name, price, description, image, categoryId, available, unit, stock, discountPercentage } = body;

    if (!name || !price || !categoryId || !unit || stock === undefined) {
        return NextResponse.json({ error: "Name, price, category, unit, and stock are required" }, { status: 400 });
    }

    const newProduct = await prisma.product.create({
      data: {
        name,
        price: parseFloat(price),
        description,
        image,
        categoryId,
        available,
        unit,
        stock: Number(stock),
        discountPercentage: Number(discountPercentage) || 0
      },
    });
    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error("Product creation error:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}