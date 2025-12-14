// Payment Request API Endpoint
// Creates a Zarinpal payment request for an order

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUserFromRequest } from '@/lib/auth';
import { createPaymentRequest } from '@/lib/zarinpal';

export async function POST(req: Request) {
    try {
        // Authenticate user
        const auth = await getAuthUserFromRequest(req);
        if (!auth || !auth.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { orderId } = await req.json();

        if (!orderId) {
            return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
        }

        // Fetch order from database
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                user: true,
                items: true,
            },
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Verify order belongs to authenticated user
        if (order.userId !== auth.user.id) {
            return NextResponse.json({ error: 'Unauthorized - Order does not belong to you' }, { status: 403 });
        }

        // Check if order is already paid
        if (order.paymentStatus === 'PAID') {
            return NextResponse.json({ error: 'Order is already paid' }, { status: 400 });
        }

        // Prepare callback URL
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const callbackUrl = `${baseUrl}/payment/callback`;

        // Create payment request with Zarinpal (use amountDue for partial credit)
        const { authority, redirectUrl } = await createPaymentRequest(
            Math.round(order.amountDue), // Use remaining amount due
            `پرداخت سفارش #${order.id.substring(0, 8)}${Number(order.creditUsed) > 0 ? ' (پرداخت جزئی)' : ''}`,
            callbackUrl,
            {
                order_id: order.id,
                mobile: order.user.phone,
            }
        );

        // Save authority to order
        await prisma.order.update({
            where: { id: orderId },
            data: {
                paymentAuthority: authority,
                paymentMethod: 'zarinpal',
            },
        });

        return NextResponse.json({
            success: true,
            authority,
            redirectUrl,
        });
    } catch (error: any) {
        console.error('❌ [Payment Request API] Error:', error);
        console.error('🔍 Error Details:', {
            message: error.message,
            stack: error.stack,
        });
        return NextResponse.json(
            { error: error.message || 'Failed to create payment request' },
            { status: 500 }
        );
    }
}
