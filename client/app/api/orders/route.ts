// FILE: app/api/orders/route.ts (Updated with GET method)
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

// --- This function handles creating new orders ---
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { cart, totalPrice, deliverySlot } = body;

    if (!cart || cart.length === 0 || !totalPrice || !deliverySlot) {
      return NextResponse.json({ error: "Missing required order data" }, { status: 400 });
    }

    const newOrder = await prisma.order.create({
      data: {
        totalPrice: totalPrice,
        deliverySlot: deliverySlot,
        userId: session.user.id,
        items: {
          create: cart.map((item: any) => ({
            productName: item.name,
            quantity: item.quantity,
            price: item.priceNumber,
          })),
        },
      },
      include: { items: true },
    });

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    console.error("Failed to create order:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}


// --- This NEW function handles fetching the user's order history ---
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
                items: true, // Include the items for each order
            },
            orderBy: {
                createdAt: 'desc', // Show the newest orders first
            },
        });

        return NextResponse.json(orders, { status: 200 });

    } catch (error) {
        console.error("Failed to fetch orders:", error);
        return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }
}