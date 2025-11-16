// FILE: app/api/worker/orders/route.ts
// API for workers to fetch orders ready for delivery, now including order items.

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUserFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const auth = await getAuthUserFromRequest(request);
    if (!auth || auth.user.role !== "WORKER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const ordersToDeliver = await prisma.order.findMany({
      where: {
        status: "SHIPPED",
      },
      include: {
        user: {
          select: {
            name: true,
            shopName: true,
            shopAddress: true,
            phone: true,
          },
        },
        items: true, // Include order items for the invoice preview
      },
      orderBy: {
        deliveryDate: "asc",
      },
    });

    return NextResponse.json(ordersToDeliver, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch orders for worker:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}