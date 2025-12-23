// FILE: app/api/categories/route.ts (Complete and with Caching)
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { revalidateTag } from "next/cache";
import { cacheKeys, getCached, invalidateCache } from "@/lib/redis";

export async function GET() {
  try {
    const cacheKey = cacheKeys.categories.all();
    const categories = await getCached(
      cacheKey,
      () =>
        prisma.category.findMany({
          include: { _count: { select: { products: true } } },
          orderBy: { name: "asc" },
        }),
      3600
    );
    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const category = await prisma.category.create({
      data: {
        name: body.name,
        icon: body.icon,
        image: body.image,
      },
    });

    // Invalidate the cache
    revalidateTag('categories');
    await invalidateCache('categories:*');

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
