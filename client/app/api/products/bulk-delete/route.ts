import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const {
      productIds,
      categoryId,
      supplierId,
      distributorId,
      status,
      searchTerm,
    } = await request.json();

    const where: any = {};

    if (Array.isArray(productIds) && productIds.length > 0) {
      where.id = { in: productIds };
    }

    if (categoryId && categoryId !== "all") where.categoryId = categoryId;
    if (supplierId && supplierId !== "all") where.supplierId = supplierId;
    if (distributorId && distributorId !== "all") where.distributorId = distributorId;

    if (status === "available") where.available = true;
    else if (status === "unavailable") where.available = false;
    else if (status === "featured") where.isFeatured = true;

    if (searchTerm) {
      where.OR = [
        { name: { contains: searchTerm, mode: "insensitive" } },
        { description: { contains: searchTerm, mode: "insensitive" } },
        { supplier: { name: { contains: searchTerm, mode: "insensitive" } } },
        { category: { name: { contains: searchTerm, mode: "insensitive" } } },
      ];
    }

    if (!where.id && !categoryId && !supplierId && !distributorId && !status && !searchTerm) {
      return NextResponse.json(
        { message: "برای حذف گروهی حداقل یک فیلتر یا لیست محصول لازم است." },
        { status: 400 }
      );
    }

    const result = await prisma.product.deleteMany({ where });

    return NextResponse.json({ deleted: result.count });
  } catch (error) {
    console.error("Bulk delete error:", error);
    return NextResponse.json({ message: "خطا در حذف گروهی" }, { status: 500 });
  }
}
