// FILE: app/api/suppliers/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUserFromRequest } from "@/lib/auth";
import { revalidateTag } from "next/cache";
import { cacheKeys, getCached, invalidateCache } from "@/lib/redis";

// --- GET suppliers ---
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");

    const cacheKey = categoryId
      ? cacheKeys.suppliers.byCategory(categoryId)
      : cacheKeys.suppliers.all();

    const suppliers = await getCached(
      cacheKey,
      () =>
        prisma.supplier.findMany({
          ...(categoryId
            ? {
                where: {
                  products: {
                    some: {
                      categoryId: categoryId,
                    },
                  },
                },
              }
            : {}),
          orderBy: { name: "asc" },
        }),
      3600
    );
    return NextResponse.json(suppliers);
  } catch (error) {
    console.error("Failed to fetch suppliers:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// --- POST a new supplier (Admin only) ---
export async function POST(req: Request) {
  try {
    const auth = await getAuthUserFromRequest(req);
    if (!auth || auth.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { name, logo } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Supplier name is required" },
        { status: 400 },
      );
    }

    const newSupplier = await prisma.supplier.create({
      data: { name, logo },
    });

    // Invalidate cache
    revalidateTag("suppliers");
    await invalidateCache("suppliers:*");

    return NextResponse.json(newSupplier, { status: 201 });
  } catch (error) {
    console.error("Failed to create supplier", error);
    return NextResponse.json(
      { error: "Failed to create supplier" },
      { status: 500 },
    );
  }
}
