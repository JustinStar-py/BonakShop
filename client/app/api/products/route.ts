// FILE: app/api/products/route.ts (Updated for Status Filter)
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "15");
    const searchTerm = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId") || "";
    const supplierId = searchParams.get("supplierId") || "";
    const status = searchParams.get("status") || "all"; // <-- فیلتر جدید

    const skip = (page - 1) * limit;

    let whereClause: any = {};

    if (searchTerm) {
      whereClause.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { supplier: { name: { contains: searchTerm, mode: 'insensitive' } } },
        { category: { name: { contains: searchTerm, mode: 'insensitive' } } },
      ];
    }

    if (categoryId) {
      whereClause.categoryId = categoryId;
    }

    if (supplierId) {
      whereClause.supplierId = supplierId;
    }

    // --- NEW: Logic for status filter ---
    if (status === 'available') {
        whereClause.available = true;
    } else if (status === 'unavailable') {
        whereClause.available = false;
    } else if (status === 'featured') {
        whereClause.isFeatured = true;
    }
    // if status is 'all', we don't add any specific filter for it

    const products = await prisma.product.findMany({
      where: whereClause,
      skip: skip,
      take: limit,
      include: {
        category: true,
        supplier: true,
        distributor: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const totalProducts = await prisma.product.count({ where: whereClause });

    return NextResponse.json({
      products,
      totalPages: Math.ceil(totalProducts / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    const body = await req.json();
    const {
      name, price, description, image, categoryId, available,
      discountPercentage, unit, stock, supplierId, distributorId,
      isFeatured, consumerPrice
    } = body;

    if (!name || !price || !categoryId || !supplierId || !distributorId) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const product = await prisma.product.create({
        data: {
            name,
            price: parseFloat(price),
            description,
            image,
            categoryId,
            supplierId,
            distributorId,
            available: Boolean(available),
            discountPercentage: parseInt(discountPercentage, 10) || 0,
            unit,
            stock: Number(stock),
            isFeatured: Boolean(isFeatured),
            consumerPrice: consumerPrice ? parseFloat(consumerPrice) : null
        }
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Product creation error:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}