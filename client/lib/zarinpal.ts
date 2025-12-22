// Zarinpal Payment Gateway Integration Library
// Implements payment request and verification flows

import type {
    ZarinpalPaymentRequest,
    ZarinpalPaymentResponse,
    ZarinpalVerifyRequest,
    ZarinpalVerifyResponse,
    ZarinpalErrorCode,
} from '@/types/zarinpal';
import { logger } from '@/lib/logger';

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
    logger.info(`Zarinpal Environment: ${ZARINPAL_ENV.toUpperCase()}`);
    logger.debug(`Zarinpal Request URL: ${ZARINPAL_REQUEST_URL}`);
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
        logger.info('Zarinpal Payment Request Started');
        logger.debug('Payment Request Body', logger.redact(requestBody as unknown as Record<string, unknown>, ['merchant_id', 'amount']));

        const response = await fetch(ZARINPAL_REQUEST_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        logger.debug(`Payment Request HTTP Status: ${response.status}`);

        const data: ZarinpalPaymentResponse = await response.json();
        logger.debug('Payment Response Data', { code: data.data?.code, hasAuthority: !!data.data?.authority });

        // Check for successful response
        if (data.data && data.data.code === 100) {
            const authority = data.data.authority;
            const redirectUrl = `${ZARINPAL_PAYMENT_URL}${authority}`;

            logger.info('Zarinpal Payment Request Success');
            logger.debug('Authority received', { authorityLength: authority?.length });

            return { authority, redirectUrl };
        }

        // Handle Zarinpal errors
        const errorMsg = `Zarinpal payment request failed: ${data.data?.message || 'Unknown error'} (Code: ${data.data?.code})`;
        logger.error('Zarinpal Payment Request Failed', errorMsg);

        throw new Error(errorMsg);
    } catch (error) {
        logger.error('Exception during Zarinpal payment request', error);
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
        logger.info('Zarinpal Payment Verification Started');
        logger.debug('Verification Request', logger.redact(requestBody as unknown as Record<string, unknown>, ['merchant_id', 'amount', 'authority']));

        const response = await fetch(ZARINPAL_VERIFY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        logger.debug(`Verification HTTP Status: ${response.status}`);

        const data: ZarinpalVerifyResponse = await response.json();
        logger.debug('Verification Response', { code: data.data?.code, hasRefId: !!data.data?.ref_id });

        // Check for successful verification (100 = success, 101 = already verified)
        if (data.data && (data.data.code === 100 || data.data.code === 101)) {
            logger.info('Zarinpal Verification Success');
            logger.debug('Payment verified', { code: data.data.code, hasRefId: !!data.data.ref_id });

            return {
                refId: data.data.ref_id,
                cardPan: data.data.card_pan,
            };
        }

        // Handle verification errors
        const errorMsg = `Zarinpal verification failed: ${data.data?.message || 'Unknown error'} (Code: ${data.data?.code})`;
        logger.error('Zarinpal Verification Failed', errorMsg);

        throw new Error(errorMsg);
    } catch (error) {
        logger.error('Exception during Zarinpal verification', error);
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
