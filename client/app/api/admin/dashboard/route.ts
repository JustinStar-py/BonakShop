import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cacheKeys, getCached } from "@/lib/redis";

export async function GET() {
  try {
    const cacheKey = cacheKeys.admin.dashboard();
    const payload = await getCached(
      cacheKey,
      async () => {
        // KPI
        const totalRevenue = await prisma.order.aggregate({ _sum: { totalPrice: true } });
        const totalOrders = await prisma.order.count();
        const totalCustomers = await prisma.user.count();

        // سفارش‌ها (جدیدترین‌ها)
        const orders = await prisma.order.findMany({
          orderBy: { createdAt: "desc" },
          include: { user: true },
          take: 10,
        });

        // مشتریان برتر
        const customerStatsRaw = await prisma.order.groupBy({
          by: ["userId"],
          _count: { id: true },
          _sum: { totalPrice: true },
        });

        // Optimization: Fetch all users in one query instead of N queries
        const userIds = customerStatsRaw.map(stat => stat.userId);
        const users = await prisma.user.findMany({
          where: { id: { in: userIds } }
        });
        
        const userMap = new Map(users.map(user => [user.id, user]));

        const customerStats = customerStatsRaw.map(stat => {
          const user = userMap.get(stat.userId);
          return {
            name: user?.shopName || user?.name || "بدون نام",
            count: stat._count.id,
            total: stat._sum.totalPrice || 0,
          };
        });

        // فروش ۷ روز اخیر
        const today = new Date();
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const last7DaysOrders = await prisma.order.findMany({
          where: {
            createdAt: {
              gte: sevenDaysAgo,
            },
          },
          select: {
            createdAt: true,
            totalPrice: true,
          },
        });

        const dailySalesMap = new Map<string, number>();
        
        // Initialize map with 0 for all 7 days
        const last7Days = Array.from({ length: 7 }).map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          const key = d.toLocaleDateString('fa-IR');
          dailySalesMap.set(key, 0);
          return { date: d, key };
        });

        // Sum up the orders
        last7DaysOrders.forEach(order => {
          const orderDateKey = new Date(order.createdAt).toLocaleDateString('fa-IR');
          if (dailySalesMap.has(orderDateKey)) {
            dailySalesMap.set(orderDateKey, dailySalesMap.get(orderDateKey)! + order.totalPrice);
          }
        });

        const dailySalesData = last7Days.map(day => ({
          name: day.key,
          فروش: dailySalesMap.get(day.key) || 0,
        }));

        return {
          kpiData: {
            totalRevenue: totalRevenue._sum.totalPrice || 0,
            totalOrders,
            totalCustomers,
          },
          orders,
          customerStats,
          dailySalesData,
        };
      },
      60
    );

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ error: "خطا در دریافت داده‌های داشبورد" }, { status: 500 });
  }
}
