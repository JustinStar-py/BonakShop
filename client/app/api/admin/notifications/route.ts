import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { PrismaClientInitializationError } from "@prisma/client/runtime/library";
import { unstable_cache } from "next/cache";

export async function GET() {
  try {
    const getNotifications = unstable_cache(
      async () => {
        // Use $transaction to bundle 3 reads into 1 connection
        const [lowStockProducts, pendingOrders, returnRequests] = await prisma.$transaction([
          // 1. Check for Low Stock Products (less than 15)
          prisma.product.findMany({
            where: {
              stock: {
                lt: 15,
              },
            },
            select: {
              id: true,
              name: true,
              stock: true,
            },
            take: 10,
          }),
          // 2. Check for Pending Orders
          prisma.order.findMany({
            where: {
              status: "PENDING",
            },
            select: {
              id: true,
              user: {
                select: {
                  name: true,
                  shopName: true,
                },
              },
              createdAt: true,
            },
            orderBy: {
              createdAt: "desc",
            },
            take: 10,
          }),
          // 3. Check for Requested Returns
          prisma.returnRequest.findMany({
            where: {
              status: "REQUESTED",
            },
            include: {
              order: {
                select: {
                  user: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
            take: 10,
          }),
        ]);

        return { lowStockProducts, pendingOrders, returnRequests };
      },
      ["admin-notifications-list"],
      { revalidate: 60, tags: ["admin-notifications"] } // Cache for 1 minute
    );

    const { lowStockProducts, pendingOrders, returnRequests } = await getNotifications();

    // Format the notifications
    const notifications = [
      ...pendingOrders.map((order) => ({
        id: `order-${order.id}`,
        type: "order",
        title: "سفارش جدید",
        message: `سفارش جدید از ${order.user.shopName || order.user.name || "کاربر ناشناس"} ثبت شده است.`,
        link: `/admin/orders`,
        timestamp: order.createdAt,
        urgent: true,
      })),
      ...returnRequests.map((req) => ({
        id: `return-${req.id}`,
        type: "return",
        title: "درخواست مرجوعی",
        message: `درخواست مرجوعی جدید از ${req.order.user.name} ثبت شده است.`,
        link: `/admin/delivery`, // Assuming returns are handled there
        timestamp: req.createdAt,
        urgent: true,
      })),
      ...lowStockProducts.map((product) => ({
        id: `stock-${product.id}`,
        type: "stock",
        title: "موجودی کم",
        message: `موجودی محصول "${product.name}" به ${product.stock} عدد رسیده است.`,
        link: `/admin/products`,
        timestamp: new Date(), // Current time as stock status is a state
        urgent: product.stock === 0,
      })),
    ];

    return NextResponse.json(notifications);
  } catch (error) {
    if (error instanceof PrismaClientInitializationError) {
      console.error("Notifications error: database unreachable", error.message);
      return NextResponse.json(
        { error: "Database unavailable" },
        { status: 503 }
      );
    }
    console.error("Notifications error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
