// FILE: app/api/admin/orders/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await getSession();
    // Check if user is logged in AND is an ADMIN
    if (!session.isLoggedIn || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch ALL orders, including user info for each order
    const orders = await prisma.order.findMany({
      include: {
        user: { // Include related user data
          select: {
            name: true,
            shopName: true
          }
        },
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(orders, { status: 200 });

  } catch (error) {
    console.error("Failed to fetch all orders:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}