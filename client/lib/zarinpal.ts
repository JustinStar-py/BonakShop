// Zarinpal Payment Gateway Integration Library
// Implements payment request and verification flows

import type {
    ZarinpalPaymentRequest,
    ZarinpalPaymentResponse,
    ZarinpalVerifyRequest,
    ZarinpalVerifyResponse,
    ZarinpalErrorCode,
} from '@/types/zarinpal';

// Zarinpal API endpoints configuration
// Use ZARINPAL_ENV to explicitly control which environment to use
const ZARINPAL_ENV = process.env.ZARINPAL_ENV || 'sandbox';

// Sandbox endpoints (for development and testing)
const SANDBOX_REQUEST_URL = 'https://sandbox.zarinpal.com/pg/v4/payment/request.json';
const SANDBOX_VERIFY_URL = 'https://sandbox.zarinpal.com/pg/v4/payment/verify.json';
const SANDBOX_PAYMENT_URL = 'https://sandbox.zarinpal.com/pg/StartPay/';

// Production endpoints (for live payments)
const PRODUCTION_REQUEST_URL = 'https://payment.zarinpal.com/pg/v4/payment/request.json';
const PRODUCTION_VERIFY_URL = 'https://payment.zarinpal.com/pg/v4/payment/verify.json';
const PRODUCTION_PAYMENT_URL = 'https://payment.zarinpal.com/pg/StartPay/';

// Select endpoints based on ZARINPAL_ENV
const ZARINPAL_REQUEST_URL = ZARINPAL_ENV === 'production'
    ? PRODUCTION_REQUEST_URL
    : SANDBOX_REQUEST_URL;

const ZARINPAL_VERIFY_URL = ZARINPAL_ENV === 'production'
    ? PRODUCTION_VERIFY_URL
    : SANDBOX_VERIFY_URL;

const ZARINPAL_PAYMENT_URL = ZARINPAL_ENV === 'production'
    ? PRODUCTION_PAYMENT_URL
    : SANDBOX_PAYMENT_URL;

// Log which environment is being used (helpful for debugging)
if (typeof window === 'undefined') { // Server-side only
    console.log(`🔧 [Zarinpal] Environment: ${ZARINPAL_ENV.toUpperCase()}`);
    console.log(`🔗 [Zarinpal] Request URL: ${ZARINPAL_REQUEST_URL}`);
}

/**
 * Create a payment request with Zarinpal
 * @returns Authority code and redirect URL on success
 */
export async function createPaymentRequest(
    amount: number,
    description: string,
    callbackUrl: string,
    metadata?: { mobile?: string; email?: string; order_id?: string }
): Promise<{ authority: string; redirectUrl: string }> {
    const merchantId = process.env.ZARINPAL_MERCHANT_ID;

    if (!merchantId) {
        throw new Error('ZARINPAL_MERCHANT_ID is not configured in environment variables');
    }

    const requestBody: ZarinpalPaymentRequest = {
        merchant_id: merchantId,
        amount,
        description,
        callback_url: callbackUrl,
        metadata,
    };

    try {
        console.log('🔵 [Zarinpal] Payment Request Started');
        console.log('📤 Request Body:', JSON.stringify(requestBody, null, 2));

        const response = await fetch(ZARINPAL_REQUEST_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        console.log('📊 HTTP Status:', response.status, response.statusText);

        const data: ZarinpalPaymentResponse = await response.json();
        console.log('📥 Response Data:', JSON.stringify(data, null, 2));

        // Check for successful response
        if (data.data && data.data.code === 100) {
            const authority = data.data.authority;
            const redirectUrl = `${ZARINPAL_PAYMENT_URL}${authority}`;

            console.log('✅ [Zarinpal] Payment Request Success');
            console.log('🔑 Authority:', authority);
            console.log('🔗 Redirect URL:', redirectUrl);

            return { authority, redirectUrl };
        }

        // Handle Zarinpal errors
        const errorMsg = `Zarinpal payment request failed: ${data.data?.message || 'Unknown error'} (Code: ${data.data?.code})`;
        console.error('❌ [Zarinpal] Payment Request Failed:', errorMsg);
        console.error('📋 Full Error Response:', JSON.stringify(data, null, 2));

        throw new Error(errorMsg);
    } catch (error) {
        console.error('💥 [Zarinpal] Exception during payment request:', error);
        throw error;
    }
}

/**
 * Verify a payment with Zarinpal
 * @returns Reference ID on successful verification
 */
export async function verifyPayment(
    authority: string,
    amount: number
): Promise<{ refId: number; cardPan: string }> {
    const merchantId = process.env.ZARINPAL_MERCHANT_ID;

    if (!merchantId) {
        throw new Error('ZARINPAL_MERCHANT_ID is not configured in environment variables');
    }

    const requestBody: ZarinpalVerifyRequest = {
        merchant_id: merchantId,
        amount,
        authority,
    };

    try {
        console.log('🔵 [Zarinpal] Payment Verification Started');
        console.log('📤 Verify Request:', JSON.stringify(requestBody, null, 2));

        const response = await fetch(ZARINPAL_VERIFY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        console.log('📊 Verify HTTP Status:', response.status, response.statusText);

        const data: ZarinpalVerifyResponse = await response.json();
        console.log('📥 Verify Response:', JSON.stringify(data, null, 2));

        // Check for successful verification (100 = success, 101 = already verified)
        if (data.data && (data.data.code === 100 || data.data.code === 101)) {
            console.log('✅ [Zarinpal] Verification Success');
            console.log('🎫 Ref ID:', data.data.ref_id);
            console.log('💳 Card PAN:', data.data.card_pan);

            return {
                refId: data.data.ref_id,
                cardPan: data.data.card_pan,
            };
        }

        // Handle verification errors
        const errorMsg = `Zarinpal verification failed: ${data.data?.message || 'Unknown error'} (Code: ${data.data?.code})`;
        console.error('❌ [Zarinpal] Verification Failed:', errorMsg);
        console.error('📋 Full Verify Error:', JSON.stringify(data, null, 2));

        throw new Error(errorMsg);
    } catch (error) {
        console.error('💥 [Zarinpal] Exception during verification:', error);
        throw error;
    }
}

/**
 * Get a human-readable error message for Zarinpal error codes
 */
export function getZarinpalErrorMessage(code: number): string {
    const errorMessages: Record<number, string> = {
        [-9]: 'خطای اعتبارسنجی - اطلاعات ارسالی معتبر نیست',
        [-10]: 'ترمینال نامعتبر - شناسه پذیرنده اشتباه است',
        [-14]: 'آدرس بازگشت با دامنه ثبت‌شده مطابقت ندارد',
        [-50]: 'مبلغ پرداختی با مبلغ تراکنش مطابقت ندارد',
        [-54]: 'کد اعتبار (Authority) نامعتبر است',
        [100]: 'تراکنش با موفقیت انجام شد',
        [101]: 'تراکنش قبلاً تایید شده است',
    };

    return errorMessages[code] || `خطای ناشناخته (کد: ${code})`;
}
