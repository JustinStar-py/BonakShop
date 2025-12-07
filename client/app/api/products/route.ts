import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUserFromRequest } from "@/lib/auth";
import { unstable_cache, revalidateTag } from "next/cache";

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

    const where: any = {};

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

    let orderBy: any = {};
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

    // Cache the data fetching logic
    const getProducts = unstable_cache(
      async () => {
        const [products, total] = await prisma.$transaction([
          prisma.product.findMany({
            where,
            include: {
              category: true,
              supplier: true,
              distributor: true,
            },
            orderBy,
            skip,
            take: limit,
          }),
          prisma.product.count({ where }),
        ]);
        return { products, total };
      },
      // Unique key for this specific query combination
      ['products-query', String(page), String(limit), search, categoryId, supplierId, sort, status || 'default'],
      { 
        revalidate: 60, // Cache search results for 1 minute
        tags: ['products'] 
      }
    );

    const { products, total } = await getProducts();

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
    const product = await prisma.product.create({
      data: {
        name: body.name,
        description: body.description,
        price: parseFloat(body.price),
        consumerPrice: body.consumerPrice ? parseFloat(body.consumerPrice) : null,
        stock: parseInt(body.stock),
        discountPercentage: body.discountPercentage ? parseInt(body.discountPercentage) : 0,
        categoryId: body.categoryId,
        supplierId: body.supplierId,
        distributorId: body.distributorId,
        image: body.image,
        available: body.available ?? true,
      },
    });

    // Invalidate caches
    revalidateTag('products');
    revalidateTag('categories'); // Because category counts might change
    revalidateTag('suppliers'); // Because supplier product counts might change

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Create product error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
