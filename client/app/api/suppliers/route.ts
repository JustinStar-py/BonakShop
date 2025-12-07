// FILE: app/api/suppliers/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUserFromRequest } from "@/lib/auth";
import { revalidateTag } from "next/cache";
import { getCachedSuppliers } from "@/lib/cache";

// --- GET suppliers ---
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");

    if (categoryId) {
      // Optimized query: Find suppliers that have at least one product in this category
      const suppliers = await prisma.supplier.findMany({
        where: {
          products: {
            some: {
              categoryId: categoryId,
            },
          },
        },
        orderBy: { name: "asc" },
      });
      return NextResponse.json(suppliers);
    }

    const allSuppliers = await getCachedSuppliers();
    return NextResponse.json(allSuppliers);
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

    return NextResponse.json(newSupplier, { status: 201 });
  } catch (error) {
    console.error("Failed to create supplier", error);
    return NextResponse.json(
      { error: "Failed to create supplier" },
      { status: 500 },
    );
  }
}