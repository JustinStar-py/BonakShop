// FILE: app/api/delivery-orders/route.ts
// FINAL VERSION: Fetches ALL orders for Admin/Worker roles, not just 'SHIPPED' ones.

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUserFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const auth = await getAuthUserFromRequest(request);
    // Security check: Allow access only for ADMIN or WORKER roles
    if (!auth || (auth.user.role !== "ADMIN" && auth.user.role !== "WORKER")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch ALL orders, regardless of status.
    const allOrders = await prisma.order.findMany({
      include: {
        user: {
          select: {
            name: true,
            shopName: true,
            shopAddress: true,
            phone: true,
            latitude: true,
            longitude: true,
          },
        },
        items: true,
      },
      orderBy: {
        createdAt: "desc", // Show the most recent orders first
      },
    });

    return NextResponse.json(allOrders, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch all orders for admin/worker:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}