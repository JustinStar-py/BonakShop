// FILE: app/api/orders/route.ts (FIXED)
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session"; // Assuming you use session management

export async function GET(request: Request) {
    const session = await getSession();
    if (!session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
        const orders = await prisma.order.findMany({
            where: { userId: session.user.id },
            include: { 
                items: true,
                returnRequest: {
                    select: { id: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(orders, { status: 200 });
    } catch (error) {
        console.error("Failed to fetch orders:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}


export async function POST(req: Request) {
    const session = await getSession();
    if (!session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    try {
        const body = await req.json();
        const { items, totalPrice, deliveryDate, settlementId, notes } = body;

        // --- FIX: More robust validation ---
        // Checks specifically for undefined/null and ensures items is a non-empty array.
        if (
            !Array.isArray(items) ||
            items.length === 0 ||
            totalPrice === undefined || // Allows for totalPrice of 0
            !deliveryDate ||
            !settlementId
        ) {
            return NextResponse.json({ error: "Missing required order data" }, { status: 400 });
        }
        
        // --- Transaction to ensure data integrity ---
        // This ensures that either the order is created and stock is updated, or nothing happens.
        const newOrder = await prisma.$transaction(async (tx) => {
            const order = await tx.order.create({
                data: {
                    userId,
                    totalPrice,
                    deliveryDate: new Date(deliveryDate),
                    settlementId,
                    notes,
                    items: {
                        create: items.map((item: any) => ({
                            productName: item.productName,
                            quantity: item.quantity,
                            price: item.price,
                            // Note: Your OrderItem model doesn't link back to Product, which is fine
                            // but something to be aware of for future features.
                        })),
                    },
                },
                include: {
                    items: true,
                },
            });

            // Decrease product stock after order is created
            for (const item of items) {
                await tx.product.update({
                    where: { id: item.productId },
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
    } catch (error: any) {
        console.error("Order creation failed:", error);
        // Provide a more specific error if stock is insufficient
        if (error.code === 'P2025' || error.message.includes('decrement')) {
             return NextResponse.json({ error: "موجودی یکی از محصولات کافی نیست." }, { status: 400 });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}