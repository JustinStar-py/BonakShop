// FILE: app/api/orders/[id]/status/route.ts
// Updated to handle status changes by ADMIN, WORKER, and CUSTOMER with proper permissions.
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUserFromRequest } from "@/lib/auth";
import { OrderStatus } from "@prisma/client";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUserFromRequest(req);
    if (!auth || !auth.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: orderId } = await params;
    const { status } = await req.json();
    const userRole = auth.user.role;

    if (typeof status !== "string" || !Object.values(OrderStatus).includes(status as OrderStatus)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    const nextStatus = status as OrderStatus;

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Permission checks
    if (userRole === 'CUSTOMER') {
        // Customers can only cancel their own PENDING orders.
        if (
          order.userId !== auth.user.id ||
          nextStatus !== OrderStatus.CANCELED ||
          order.status !== OrderStatus.PENDING
        ) {
            return NextResponse.json({ error: "Action not allowed" }, { status: 403 });
        }
    } else if (userRole === 'WORKER') {
        // Workers can advance orders through delivery workflow.
        const canMarkShipped =
          order.status === OrderStatus.PENDING && nextStatus === OrderStatus.SHIPPED;
        const canMarkDelivered =
          order.status === OrderStatus.SHIPPED && nextStatus === OrderStatus.DELIVERED;

        if (!canMarkShipped && !canMarkDelivered) {
          return NextResponse.json(
            { error: "Workers can only mark PENDING→SHIPPED or SHIPPED→DELIVERED" },
            { status: 403 }
          );
        }
    }
    // ADMIN has full control, no extra checks needed.

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: nextStatus },
    });

    return NextResponse.json(updatedOrder, { status: 200 });
  } catch (error) {
    console.error("Status update error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
