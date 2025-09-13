// FILE: app/api/products/lists/route.ts (New File)
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // e.g., 'featured', 'newest', 'bestsellers'

    let products;
    const take = 10; // تعداد محصولاتی که در هر لیست نمایش داده می‌شود

    switch (type) {
      case 'featured':
        // دریافت محصولاتی که به صورت دستی ویژه شده‌اند
        products = await prisma.product.findMany({
          where: { isFeatured: true },
          include: { supplier: true },
          take,
        });
        break;

      case 'newest':
        // دریافت جدیدترین محصولات بر اساس تاریخ ایجاد
        products = await prisma.product.findMany({
          orderBy: { createdAt: 'desc' },
          include: { supplier: true },
          take,
        });
        break;

      case 'bestsellers':
        // دریافت پرفروش‌ترین محصولات
        // نکته: این یک پیاده‌سازی ساده‌شده است. در یک پروژه واقعی، این بخش باید بهینه شود.
        const popularItems = await prisma.orderItem.groupBy({
          by: ['productName'],
          _sum: {
            quantity: true,
          },
          orderBy: {
            _sum: {
              quantity: 'desc',
            },
          },
          take,
        });
        
        const productNames = popularItems.map(item => item.productName);
        products = await prisma.product.findMany({
            where: {
                name: { in: productNames }
            },
            include: { supplier: true }
        });
        // Sort them according to the bestseller list
        products.sort((a, b) => productNames.indexOf(a.name) - productNames.indexOf(b.name));
        break;

      default:
        return NextResponse.json({ error: "Invalid list type specified" }, { status: 400 });
    }

    return NextResponse.json(products);

  } catch (error) {
    console.error(`Failed to fetch product list:`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}