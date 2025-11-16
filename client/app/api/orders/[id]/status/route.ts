// FILE: app/api/orders/[id]/status/route.ts
// Updated to handle status changes by ADMIN, WORKER, and CUSTOMER with proper permissions.
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUserFromRequest } from "@/lib/auth";
import { OrderStatus } from "@prisma/client";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthUserFromRequest(req);
    if (!auth || !auth.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orderId = params.id;
    const { status } = await req.json();
    const userRole = auth.user.role;

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Permission checks
    if (userRole === 'CUSTOMER') {
        // Customers can only cancel their own PENDING orders.
        if (order.userId !== auth.user.id || status !== 'CANCELED' || order.status !== 'PENDING') {
            return NextResponse.json({ error: "Action not allowed" }, { status: 403 });
        }
    } else if (userRole === 'WORKER') {
        // Workers can only manage SHIPPED or DELIVERED statuses
        if (![OrderStatus.SHIPPED, OrderStatus.DELIVERED].includes(order.status) && status !== 'DELIVERED') {
            return NextResponse.json({ error: "Workers can only confirm delivery for shipped orders" }, { status: 403 });
        }
    }
    // ADMIN has full control, no extra checks needed.

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: status as OrderStatus },
    });

    return NextResponse.json(updatedOrder, { status: 200 });
  } catch (error) {
    console.error("Status update error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}