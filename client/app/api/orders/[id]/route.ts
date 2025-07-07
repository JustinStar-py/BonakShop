// FILE: app/api/orders/[id]/route.ts
// API route to get details for a single order.
// This is separate from the status update route.
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

// GET a single order by its ID
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orderId = params.id;
    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
        // Security check: ensure the user is either the order owner or an admin/worker
        ...(session.user.role === 'CUSTOMER' && { userId: session.user.id }),
      },
      include: {
        items: true,
        user: {
            select: { name: true, shopName: true, shopAddress: true, phone: true }
        }
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found or access denied" }, { status: 404 });
    }
    
    // If the user is a CUSTOMER, ensure they are not accessing other people's orders
    if (session.user.role === 'CUSTOMER' && order.userId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(order, { status: 200 });

  } catch (error) {
    console.error(`Failed to fetch order ${params.id}:`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}