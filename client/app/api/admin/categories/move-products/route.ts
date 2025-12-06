import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { sourceCategoryId, targetCategoryId } = await request.json();

    if (!sourceCategoryId || !targetCategoryId) {
      return NextResponse.json(
        { error: "دسته‌بندی مبدا و مقصد الزامی است." },
        { status: 400 }
      );
    }

    if (sourceCategoryId === targetCategoryId) {
      return NextResponse.json(
        { error: "دسته‌بندی مبدا و مقصد نمی‌توانند یکسان باشند." },
        { status: 400 }
      );
    }

    const updateResult = await prisma.product.updateMany({
      where: {
        categoryId: sourceCategoryId,
      },
      data: {
        categoryId: targetCategoryId,
      },
    });

    return NextResponse.json({
      success: true,
      count: updateResult.count,
      message: `${updateResult.count} محصول با موفقیت جابجا شدند.`,
    });
  } catch (error) {
    console.error("Error moving products:", error);
    return NextResponse.json(
      { error: "خطا در جابجایی محصولات." },
      { status: 500 }
    );
  }
}
