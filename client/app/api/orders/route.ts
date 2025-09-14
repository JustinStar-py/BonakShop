// FILE: app/api/orders/route.ts (FINAL GUARANTEED FIX)
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

// --- (GET function remains unchanged) ---
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
        // deliveryDate is now expected to be a 'YYYY-MM-DD' string
        const { items, totalPrice, deliveryDate, settlementId, notes } = body;

        if (
            !Array.isArray(items) || items.length === 0 ||
            totalPrice === undefined || !deliveryDate || !settlementId
        ) {
            return NextResponse.json({ error: "Missing required order data" }, { status: 400 });
        }
        
        // --- FIX: The server now receives a string and creates a new Date from it. ---
        // Creating a new Date from a 'YYYY-MM-DD' string correctly interprets it
        // as UTC midnight, preventing any timezone shift. This is the most reliable method.
        const safeDeliveryDate = new Date(deliveryDate);

        const newOrder = await prisma.$transaction(async (tx) => {
            const order = await tx.order.create({
                data: {
                    userId,
                    totalPrice,
                    deliveryDate: safeDeliveryDate, // Use the newly created Date object
                    settlementId,
                    notes,
                    items: {
                        create: items.map((item: any) => ({
                            productName: item.productName,
                            quantity: item.quantity,
                            price: item.price,
                        })),
                    },
                },
                include: { items: true },
            });

            for (const item of items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { decrement: item.quantity } },
                });
            }

            return order;
        });

        return NextResponse.json(newOrder, { status: 201 });
    } catch (error: any) {
        console.error("Order creation failed:", error);
        if (error.code === 'P2025' || error.message.includes('decrement')) {
             return NextResponse.json({ error: "موجودی یکی از محصولات کافی نیست." }, { status: 400 });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}