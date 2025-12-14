// Zarinpal Payment Gateway Type Definitions
// Based on official Zarinpal PG v4 documentation

/**
 * Payment request body for Zarinpal
 */
export interface ZarinpalPaymentRequest {
    merchant_id: string;
    amount: number;
    currency?: 'IRR' | 'IRT';
    description: string;
    callback_url: string;
    referrer_id?: string;
    metadata?: {
        mobile?: string;
        email?: string;
        order_id?: string;
    };
}

/**
 * Successful payment request response from Zarinpal
 */
export interface ZarinpalPaymentResponse {
    data: {
        code: number;
        message: string;
        authority: string;
        fee_type: string;
        fee: number;
    };
    errors: any[];
}

/**
 * Payment verification request body for Zarinpal
 */
export interface ZarinpalVerifyRequest {
    merchant_id: string;
    amount: number;
    authority: string;
}

/**
 * Payment verification response from Zarinpal
 */
export interface ZarinpalVerifyResponse {
    data: {
        code: number;
        message: string;
        card_hash: string;
        card_pan: string;
        ref_id: number;
        fee_type: string;
        fee: number;
    };
    errors: any[];
}

/**
 * Zarinpal error codes (selected common codes)
 */
export enum ZarinpalErrorCode {
    SUCCESS = 100,
    ALREADY_VERIFIED = 101,
    VALIDATION_ERROR = -9,
    INVALID_TERMINAL = -10,
    CALLBACK_URL_MISMATCH = -14,
    AMOUNT_MISMATCH = -50,
    INVALID_AUTHORITY = -54,
}

/**
 * Helper type for payment callback query params
 */
export interface PaymentCallbackParams {
    Authority: string;
    Status: 'OK' | 'NOK';
}
