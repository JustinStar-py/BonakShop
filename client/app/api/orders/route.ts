// FILE: app/api/orders/route.ts (Final and Corrected Version)
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import type { CartItem } from "@/types"; // Import CartItem for type safety

// --- This function handles CREATING new orders ---
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { cart, totalPrice, deliverySlot, notes } = body;

    if (!cart || cart.length === 0 || !totalPrice || !deliverySlot) {
      return NextResponse.json({ error: "Missing required order data" }, { status: 400 });
    }

    const newOrder = await prisma.order.create({
      data: {
        totalPrice: totalPrice,
        deliverySlot: deliverySlot,
        userId: session.user.id,
        notes: notes,
        items: {
          create: cart.map((item: CartItem) => ({
            productName: item.name,
            quantity: item.quantity,
            // *** THE FIX IS HERE: We now correctly pass the price for each item ***
            price: item.price, 
          })),
        },
      },
      include: {
        items: true, // Include items in the response
      },
    });

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    console.error("Failed to create order:", error);
    // Provide a more specific error message if possible
    const errorMessage = error instanceof Error ? error.message : "Failed to create order";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// --- This function handles FETCHING the user's order history ---
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
