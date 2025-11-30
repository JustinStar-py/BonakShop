// FILE: app/api/categories/route.ts (Complete and with Caching)
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCachedCategories } from "@/lib/cache";
import { revalidateTag } from "next/cache";

export async function GET() {
  try {
    const categories = await getCachedCategories();
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

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}