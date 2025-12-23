// Payment Verification API Endpoint
// Verifies Zarinpal payment and updates order status

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPayment } from '@/lib/zarinpal';
import { getAuthUserFromRequest } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        // Get authenticated user (optional but recommended for additional security)
        const auth = await getAuthUserFromRequest(req);

        const { authority, status } = await req.json();

        if (!authority) {
            return NextResponse.json({ error: 'Authority is required' }, { status: 400 });
        }

        // Find order by payment authority
        const order = await prisma.order.findFirst({
            where: { paymentAuthority: authority },
            include: { user: true },
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found for this payment' }, { status: 404 });
        }

        // SECURITY: Optional auth check - verify order belongs to authenticated user
        // This prevents unauthorized verification attempts
        if (auth && auth.user && order.userId !== auth.user.id) {
            console.warn('⚠️ Verification attempt for order that does not belong to authenticated user');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // IMPROVEMENT: If status is NOK, keep order PENDING (not FAILED) to allow retry
        if (status !== 'OK') {
            console.log('ℹ️ Payment cancelled or failed - keeping order PENDING for retry');

            return NextResponse.json({
                success: false,
                message: 'پرداخت لغو شد. می‌توانید مجدداً تلاش کنید.',
                orderId: order.id,
                canRetry: true,
            });
        }

        // Check if already paid (idempotency)
        if (order.paymentStatus === 'PAID') {
            console.log('ℹ️ Order already paid - returning existing refId');
            return NextResponse.json({
                success: true,
                message: 'این تراکنش قبلاً تایید شده است',
                orderId: order.id,
                refId: order.paymentRefId,
            });
        }

        // Verify payment with Zarinpal (use amountDue, not totalPrice)
        const { refId, cardPan } = await verifyPayment(
            authority,
            Math.round(order.amountDue)
        );

        // Update order and deduct credit in a transaction
        await prisma.$transaction(async (tx) => {
            // Update order with payment information
            await tx.order.update({
                where: { id: order.id },
                data: {
                    paymentStatus: 'PAID',
                    paymentRefId: String(refId),
                    paidAt: new Date(),
                },
            });

            // CRITICAL FIX: Only deduct credit if amountDue > 0
            // This prevents double deduction for full-credit orders
            // Full credit orders (amountDue === 0) already had credit deducted at creation
            if (Number(order.creditUsed) > 0 && order.amountDue > 0) {
                console.log(`💰 Deducting reserved credit: ${order.creditUsed}`);
                await tx.user.update({
                    where: { id: order.userId },
                    data: { balance: { decrement: Number(order.creditUsed) } },
                });
            } else if (Number(order.creditUsed) > 0 && order.amountDue === 0) {
                console.log('ℹ️ Skipping credit deduction - already deducted for full-credit order');
            }
        });

        // Send order confirmation email (background job)
        try {
            const { sendOrderConfirmation } = await import('@/lib/jobs');
            await sendOrderConfirmation({
                orderId: order.id,
                userId: order.userId,
                totalPrice: order.totalPrice,
                deliveryDate: order.deliveryDate.toISOString(),
            });
        } catch (emailError) {
            console.error('Failed to send confirmation email:', emailError);
            // Don't fail the payment if email fails
        }

        return NextResponse.json({
            success: true,
            message: 'پرداخت با موفقیت انجام شد',
            orderId: order.id,
            refId: String(refId),
            cardPan,
        });
    } catch (error) {
        console.error('❌ Payment verification error:', error);
        const message = error instanceof Error ? error.message : undefined;
        return NextResponse.json(
            { error: message || 'Failed to verify payment' },
            { status: 500 }
        );
    }
}
