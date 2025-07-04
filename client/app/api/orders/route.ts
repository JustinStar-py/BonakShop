// FILE: app/api/orders/route.ts
// Handles creating new orders and fetching user's order history.
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import type { CartItem } from "@/types";

// --- Handles CREATING new orders ---
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { cart, totalPrice, deliveryDate, settlementId, notes } = body;

    // Validate incoming data
    if (!cart || cart.length === 0 || !totalPrice || !deliveryDate || !settlementId) {
      return NextResponse.json({ error: "Missing required order data" }, { status: 400 });
    }

    const newOrder = await prisma.order.create({
      data: {
        totalPrice: totalPrice,
        deliveryDate: new Date(deliveryDate), // Ensure it's a Date object
        settlementId: settlementId,
        userId: session.user.id,
        notes: notes,
        items: {
          create: cart.map((item: CartItem) => ({
            productName: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    console.error("Failed to create order:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create order";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// --- Handles FETCHING the user's order history ---
export async function GET() {
    try {
        const session = await getSession();
        if (!session.isLoggedIn) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const orders = await prisma.order.findMany({
            where: {
                userId: session.user.id,
            },
            include: {
                items: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json(orders, { status: 200 });

    } catch (error) {
        console.error("Failed to fetch orders:", error);
        return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }
}