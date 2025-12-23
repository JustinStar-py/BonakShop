import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getAuthUserFromRequest } from "@/lib/auth";
import { revalidateTag } from "next/cache";
import { cacheKeys, getCached, invalidateCache } from "@/lib/redis";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId") || "";
    const supplierId = searchParams.get("supplierId") || "";
    const sort = searchParams.get("sort") || "newest";
    const status = searchParams.get("status");

    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {};

    // Default to available: true if status is not provided (for public users)
    if (!status) {
      where.available = true;
    } else if (status === "available") {
      where.available = true;
    } else if (status === "unavailable") {
      where.available = false;
    }
    // if status === "all", we don't set where.available, so it returns both.

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (categoryId && categoryId !== "all") {
      where.categoryId = categoryId;
    }

    if (supplierId && supplierId !== "all") {
      where.supplierId = supplierId;
    }

    let orderBy: Prisma.ProductOrderByWithRelationInput = {};
    switch (sort) {
      case "bestselling":
        // Assuming we have an orders relation or a 'sales' field. 
        // For now, let's just sort by name or stock as a placeholder if no sales field.
        // Better: 'isFeatured' for now or random.
        orderBy = { isFeatured: 'desc' };
        break;
      case "cheapest":
        orderBy = { price: "asc" };
        break;
      case "expensive":
        orderBy = { price: "desc" };
        break;
      case "newest":
      default:
        orderBy = { createdAt: "desc" };
    }

    const cacheKey = cacheKeys.products.list({
      page,
      limit,
      search,
      categoryId: categoryId || undefined,
      supplierId: supplierId || undefined,
      sort,
      status
    });

    const { products, total } = await getCached(
      cacheKey,
      async () => {
        const [products, total] = await prisma.$transaction([
          prisma.product.findMany({
            where,
            include: {
              category: { select: { id: true, name: true, icon: true } },
              supplier: { select: { id: true, name: true } },
              distributor: { select: { id: true, name: true } },
            },
            orderBy,
            skip,
            take: limit,
          }),
          prisma.product.count({ where }),
        ]);
        return { products, total };
      },
      60
    );

    return NextResponse.json({
      products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Products error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthUserFromRequest(req);
    if (!auth || auth.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();

    // Validate input using Zod
    const { createProductSchema, validateBody } = await import('@/lib/validation');
    const validation = validateBody(createProductSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: validation.data!
    });

    // Invalidate caches
    revalidateTag('products', 'max');
    revalidateTag('categories', 'max'); // Because category counts might change
    revalidateTag('suppliers', 'max'); // Because supplier product counts might change
    await invalidateCache('products:list:*');
    await invalidateCache('products:lists:*');
    await invalidateCache('categories:*');
    await invalidateCache('suppliers:*');
    await invalidateCache('search:products:*');

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Create product error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

