// FILE: app/api/products/route.ts

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { jwtVerify } from "jose";

// نوع داده‌ای که از JWT انتظار داریم (بر اساس login)
interface JwtUser {
  id?: string;
  role?: string;
  phone?: string;
}

// گرفتن اطلاعات کاربر از روی JWT در هدر Authorization
async function getUserFromRequest(req: Request): Promise<JwtUser | null> {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.split(" ")[1];
  if (!token) return null;

  try {
    const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET!);
    const { payload } = await jwtVerify(token, secret);

    return {
      id: payload.userId as string | undefined,
      role: payload.role as string | undefined,
      phone: payload.phone as string | undefined,
    };
  } catch (e) {
    console.error("JWT verify failed in /api/products:", e);
    return null;
  }
}

// GET /api/products
// لیست محصولات با سرچ، فیلتر دسته، تأمین‌کننده و status و صفحه‌بندی
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "15");
    const searchTerm = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId") || "";
    const supplierId = searchParams.get("supplierId") || "";
    const distributorId = searchParams.get("distributorId") || "";
    const status = searchParams.get("status") || "all"; // فیلتر جدید
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const order = (searchParams.get("order") || "desc").toLowerCase() === "asc" ? "asc" : "desc";

    const skip = (page - 1) * limit;

    let whereClause: any = {};

    if (searchTerm) {
      whereClause.OR = [
        { name: { contains: searchTerm, mode: "insensitive" } },
        { description: { contains: searchTerm, mode: "insensitive" } },
        { supplier: { name: { contains: searchTerm, mode: "insensitive" } } },
        { category: { name: { contains: searchTerm, mode: "insensitive" } } },
      ];
    }

    if (distributorId && distributorId !== "all") {
      whereClause.distributorId = distributorId;
    }

    if (categoryId && categoryId !== "all") {
      whereClause.categoryId = categoryId;
    }

    if (supplierId && supplierId !== "all") {
      whereClause.supplierId = supplierId;
    }

    // فیلتر status
    if (status === "available") {
      whereClause.available = true;
    } else if (status === "unavailable") {
      whereClause.available = false;
    } else if (status === "featured") {
      whereClause.isFeatured = true;
    }
    // اگر status = all باشد، فیلتر اضافه نمی‌کنیم

    let orderBy: any = { createdAt: order };
    if (sortBy === "price") {
      orderBy = { price: order };
    } else if (sortBy === "createdAt") {
      orderBy = { createdAt: order };
    } else if (sortBy === "discount") {
      orderBy = { discountPercentage: order };
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      skip: skip,
      take: limit,
      include: {
        category: true,
        supplier: true,
        distributor: true,
      },
      orderBy,
    });

    const totalProducts = await prisma.product.count({ where: whereClause });

    return NextResponse.json({
      products,
      totalPages: Math.ceil(totalProducts / limit),
      currentPage: page,
      totalProducts,
    });
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// POST /api/products
// فقط ADMIN می‌تواند محصول جدید اضافه کند (بر اساس JWT)
export async function POST(req: Request) {
  try {
    const authUser = await getUserFromRequest(req);

    // اگر توکن نامعتبر بود یا نقش ADMIN نبود → Forbidden
    if (!authUser || authUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      price,
      description,
      image,
      categoryId,
      available,
      discountPercentage,
      unit,
      stock,
      supplierId,
      distributorId,
      isFeatured,
      consumerPrice,
    } = body;

    // فیلدهای ضروری
    if (!name || !price || !categoryId || !supplierId || !distributorId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
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
        consumerPrice: consumerPrice ? parseFloat(consumerPrice) : null,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Product creation error:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 },
    );
  }
}
