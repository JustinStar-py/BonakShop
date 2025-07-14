import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
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
    const customerStats = await Promise.all(
      customerStatsRaw.map(async stat => {
        const user = await prisma.user.findUnique({ where: { id: stat.userId } });
        return {
          name: user?.shopName || user?.name || "بدون نام",
          count: stat._count.id,
          total: stat._sum.totalPrice || 0,
        };
      })
    );

    // فروش ۷ روز اخیر
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d;
    });
    const dailySalesData = await Promise.all(
      last7Days.map(async date => {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);
        const ordersOfDay = await prisma.order.findMany({
          where: { createdAt: { gte: start, lte: end } },
        });
        const total = ordersOfDay.reduce((sum, o) => sum + o.totalPrice, 0);
        return {
          name: start.toLocaleDateString('fa-IR'),
          فروش: total,
        };
      })
    );

    return NextResponse.json({
      kpiData: {
        totalRevenue: totalRevenue._sum.totalPrice || 0,
        totalOrders,
        totalCustomers,
      },
      orders,
      customerStats,
      dailySalesData,
    });
  } catch (error) {
    return NextResponse.json({ error: "خطا در دریافت داده‌های داشبورد" }, { status: 500 });
  }
}