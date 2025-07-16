// FILE: app/api/orders/route.ts (Updated for Stock Management)
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import type { CartItem } from "@/types";

// --- Handles CREATING new orders with stock management ---
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { cart, totalPrice, deliveryDate, settlementId, notes } = body;

    if (!cart || cart.length === 0 || !totalPrice || !deliveryDate || !settlementId) {
      return NextResponse.json({ error: "Missing required order data" }, { status: 400 });
    }

    // Use a transaction to ensure both stock update and order creation are successful
    const newOrder = await prisma.$transaction(async (tx) => {
      // 1. Check stock and prepare updates for all items in the cart
      for (const item of cart) {
        const product = await tx.product.findUnique({
          where: { id: item.id },
        });

        if (!product) {
          throw new Error(`محصول ${item.name} یافت نشد.`);
        }
        if (product.stock < item.quantity) {
          throw new Error(`موجودی محصول ${item.name} کافی نیست.`);
        }
      }
      
      // 2. Create the new order
      const order = await tx.order.create({
        data: {
          totalPrice: totalPrice,
          deliveryDate: new Date(deliveryDate),
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

      // 3. Update the stock for each product
      for (const item of cart) {
          await tx.product.update({
              where: { id: item.id },
              data: {
                  stock: {
                      decrement: item.quantity,
                  },
              },
          });
      }

      return order;
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