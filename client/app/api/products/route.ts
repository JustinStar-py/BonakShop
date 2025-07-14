// justinstar-py/bonakshop/BonakShop-e6b838d87bef95729686f4e3b951e4072eed623d/client/app/api/products/route.ts
// FILE: app/api/products/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

// GET all products with all relations
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: { 
          category: true,
          supplier: true,
          distributor: true // FIX: Ensure distributor is included
      },
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
    const { name, price, description, image, categoryId, available, unit, stock, discountPercentage, supplierId, distributorId } = body;

    if (!name || !price || !categoryId || !unit || stock === undefined || !supplierId || !distributorId) {
        return NextResponse.json({ error: "Name, price, category, unit, stock, supplier, and distributor are required" }, { status: 400 });
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
        discountPercentage: Number(discountPercentage) || 0,
        supplierId,
        distributorId
      },
    });
    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error("Product creation error:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}