// FILE: app/api/admin/orders/route.ts (CORRECTED)
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUserFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const auth = await getAuthUserFromRequest(request);
    // Note: this route is only for ADMIN.
    if (!auth || auth.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const orders = await prisma.order.findMany({
      include: {
        user: {
          select: { name: true, shopName: true }
        },
        items: {
          include: {
            product: {
              include: {
                supplier: true,
                distributor: true,
              }
            }
          }
        },
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
