// FILE: app/api/orders/route.ts (WITH CREDIT SUPPORT)
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUserFromRequest } from "@/lib/auth";

// --- (GET function remains unchanged) ---
export async function GET(request: Request) {
    const auth = await getAuthUserFromRequest(request);
    if (!auth || !auth.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
        const orders = await prisma.order.findMany({
            where: { userId: auth.user.id },
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

// --- (POST function with credit support) ---
export async function POST(req: Request) {
    const auth = await getAuthUserFromRequest(req);
    if (!auth || !auth.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = auth.user.id;

    try {
        const body = await req.json();
        const { items, totalPrice, deliveryDate, notes, useCredit } = body;

        if (!Array.isArray(items) || items.length === 0 || totalPrice === undefined || !deliveryDate) {
            return NextResponse.json({ error: "Missing required order data" }, { status: 400 });
        }

        const safeDeliveryDate = new Date(deliveryDate);

        // Get or create default CASH settlement
        const cashSettlement = await prisma.settlement.upsert({
            where: { name: 'CASH' },
            create: { name: 'CASH', description: 'نقدی - پرداخت آنلاین' },
            update: {},
        });

        const newOrder = await prisma.$transaction(async (tx) => {
            // Fetch user's current balance if using credit
            let creditToUse = 0;
            let amountDue = totalPrice;

            if (useCredit) {
                const user = await tx.user.findUnique({
                    where: { id: userId },
                    select: { balance: true },
                });

                if (user && Number(user.balance) > 0) {
                    // Calculate how much credit can be used (min of balance and total)
                    const availableCredit = Number(user.balance);
                    creditToUse = Math.min(availableCredit, totalPrice);
                    amountDue = totalPrice - creditToUse;

                    // If credit covers the full amount, deduct immediately
                    if (amountDue === 0) {
                        await tx.user.update({
                            where: { id: userId },
                            data: { balance: { decrement: creditToUse } },
                        });
                    }
                }
            }

            // Create the order
            const order = await tx.order.create({
                data: {
                    userId,
                    totalPrice,
                    deliveryDate: safeDeliveryDate,
                    settlementId: cashSettlement.id,
                    notes,
                    creditUsed: creditToUse,
                    amountDue,
                    paymentStatus: amountDue === 0 ? 'PAID' : 'PENDING',
                    paidAt: amountDue === 0 ? new Date() : null,
                    items: {
                        create: items.map((item: any) => ({
                            productName: item.productName,
                            quantity: item.quantity,
                            price: item.price,
                            productId: item.productId,
                        })),
                    },
                },
                include: { items: true },
            });

            // Decrement product stock
            for (const item of items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { decrement: item.quantity } },
                });
            }

            return order;
        });

        // If fully paid with credit, send confirmation email
        if (newOrder.paymentStatus === 'PAID') {
            try {
                const { sendOrderConfirmation } = await import('@/lib/jobs');
                await sendOrderConfirmation({
                    orderId: newOrder.id,
                    userId,
                    totalPrice,
                    deliveryDate: safeDeliveryDate.toISOString(),
                });
            } catch (emailError) {
                console.error('Failed to send confirmation email:', emailError);
            }

            return NextResponse.json({
                success: true,
                orderId: newOrder.id,
                message: 'سفارش با موفقیت ثبت و پرداخت شد',
                paidWithCredit: true,
            }, { status: 201 });
        }

        // Otherwise, return order ID for payment redirect
        return NextResponse.json({
            orderId: newOrder.id,
            amountDue: newOrder.amountDue,
            creditUsed: Number(newOrder.creditUsed),
            message: 'Order created, proceed to payment',
        }, { status: 201 });

    } catch (error: any) {
        console.error("Order creation failed:", error);
        if (error.code === 'P2025' || error.message.includes('decrement')) {
            return NextResponse.json({ error: "موجودی یکی از محصولات کافی نیست." }, { status: 400 });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
