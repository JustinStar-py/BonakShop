// FILE: app/api/products/lists/route.ts (New File)
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cacheKeys, getCached } from "@/lib/redis";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // e.g., 'featured', 'newest', 'bestsellers'

    const take = 10; // تعداد محصولاتی که در هر لیست نمایش داده می‌شود
    const validTypes = ['featured', 'newest', 'bestsellers'];
    if (!type || !validTypes.includes(type)) {
      return NextResponse.json({ error: "Invalid list type specified" }, { status: 400 });
    }

    const cacheKey = cacheKeys.products.listType(type);

    const products = await getCached(
      cacheKey,
      async () => {
        switch (type) {
          case 'featured':
            // دریافت محصولاتی که به صورت دستی ویژه شده‌اند
            return prisma.product.findMany({
              where: { isFeatured: true },
              include: { supplier: { select: { id: true, name: true } } },
              take,
            });

          case 'newest':
            // دریافت جدیدترین محصولات بر اساس تاریخ ایجاد
            return prisma.product.findMany({
              orderBy: { createdAt: 'desc' },
              include: { supplier: { select: { id: true, name: true } } },
              take,
            });

          case 'bestsellers': {
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
            const list = await prisma.product.findMany({
              where: {
                name: { in: productNames }
              },
              include: { supplier: { select: { id: true, name: true } } }
            });
            // Sort them according to the bestseller list
            list.sort((a, b) => productNames.indexOf(a.name) - productNames.indexOf(b.name));
            return list;
          }

          default:
            return [];
        }
      },
      300
    );

    return NextResponse.json(products);

  } catch (error) {
    console.error(`Failed to fetch product list:`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
