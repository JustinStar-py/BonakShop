import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // 1. Check for Low Stock Products (less than 15)
    const lowStockProducts = await prisma.product.findMany({
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
      take: 10, // Limit to top 10 to avoid bloating the response
    });

    // 2. Check for Pending Orders
    const pendingOrders = await prisma.order.findMany({
      where: {
        status: "PENDING",
      },
      select: {
        id: true,
        user: {
            select: {
                name: true,
                shopName: true,
            }
        },
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10,
    });

    // 3. Check for Requested Returns
    const returnRequests = await prisma.returnRequest.findMany({
      where: {
        status: "REQUESTED",
      },
      include: {
        order: {
            select: {
                user: {
                    select: {
                        name: true
                    }
                }
            }
        }
      },
      take: 10,
    });

    // Format the notifications
    const notifications = [
      ...pendingOrders.map(order => ({
        id: `order-${order.id}`,
        type: 'order',
        title: 'سفارش جدید',
        message: `سفارش جدید از ${order.user.shopName || order.user.name || 'کاربر ناشناس'} ثبت شده است.`,
        link: `/admin/procurement`, // Or orders page
        timestamp: order.createdAt,
        urgent: true
      })),
      ...returnRequests.map(req => ({
        id: `return-${req.id}`,
        type: 'return',
        title: 'درخواست مرجوعی',
        message: `درخواست مرجوعی جدید از ${req.order.user.name} ثبت شده است.`,
        link: `/admin/delivery`, // Assuming returns are handled there
        timestamp: req.createdAt, // You might need to add createdAt to ReturnRequest in schema if not present, it is present based on previous read
        urgent: true
      })),
      ...lowStockProducts.map(product => ({
        id: `stock-${product.id}`,
        type: 'stock',
        title: 'موجودی کم',
        message: `موجودی محصول "${product.name}" به ${product.stock} عدد رسیده است.`,
        link: `/admin/products`,
        timestamp: new Date(), // Current time as stock status is a state
        urgent: product.stock === 0
      })),
    ];

    // Sort by "urgency" or date? Let's just sort by type/priority implicitly for now, 
    // but maybe putting orders first is best. They are already at the top.

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Notifications error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
