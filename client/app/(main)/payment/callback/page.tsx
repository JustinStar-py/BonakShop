"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircleLinear as CheckCircle2, CloseCircleLinear as XCircle, RestartLinear as Loader2, AltArrowRightLinear as ArrowRight, BillListLinear as Receipt } from "@solar-icons/react-perf";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import apiClient from "@/lib/apiClient";
import toPersianDigits from "@/utils/numberFormatter";

type PaymentVerificationResponse = {
    success: boolean;
    message?: string;
    orderId?: string;
    refId?: string;
    cardPan?: string;
    canRetry?: boolean;
    error?: string;
};

const getErrorMessage = (err: unknown) => {
    if (typeof err === "object" && err && "response" in err) {
        const response = (err as { response?: { data?: { error?: string } } }).response;
        return response?.data?.error;
    }
    if (err instanceof Error) {
        return err.message;
    }
    return null;
};

export default function PaymentCallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [paymentData, setPaymentData] = useState<PaymentVerificationResponse | null>(null);

    const verifyPayment = useCallback(async () => {
        try {
            const authority = searchParams.get("Authority");
            const status = searchParams.get("Status");

            if (!authority) {
                setError("اطلاعات پرداخت نامعتبر است");
                setLoading(false);
                return;
            }

            // Call verification API
            const response = await apiClient.post<PaymentVerificationResponse>("/payment/verify", {
                authority,
                status,
            });

            if (response.data.success) {
                setSuccess(true);
                setPaymentData(response.data);
            } else {
                setError(response.data.message || "پرداخت ناموفق بود");
            }
        } catch (err) {
            console.error("Payment verification error:", err);
            setError(getErrorMessage(err) || "خطا در تایید پرداخت");
        } finally {
            setLoading(false);
        }
    }, [searchParams]);

    useEffect(() => {
        verifyPayment();
    }, [verifyPayment]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md border-none shadow-lg">
                    <CardContent className="pt-6 pb-6">
                        <div className="flex flex-col items-center gap-4 text-center">
                            <Loader2 className="w-16 h-16 text-green-600 animate-spin" />
                            <h2 className="text-xl font-bold text-gray-800">
                                در حال تایید پرداخت...
                            </h2>
                            <p className="text-gray-500 text-sm">
                                لطفاً صبر کنید، پرداخت شما در حال بررسی است
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (success && paymentData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md border-none shadow-lg">
                    <CardHeader className="text-center pb-4">
                        <div className="bg-green-100 p-4 rounded-full w-fit mx-auto mb-4 animate-in zoom-in duration-300">
                            <CheckCircle2 className="w-16 h-16 text-green-600" />
                        </div>
                        <CardTitle className="text-2xl text-green-600">
                            پرداخت موفق
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <p className="text-center text-gray-600">
                            پرداخت شما با موفقیت انجام شد و سفارش ثبت گردید
                        </p>

                        {/* Payment Details */}
                        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">کد پیگیری:</span>
                                <span className="font-bold text-gray-800">
                                    {toPersianDigits(paymentData.refId ? parseInt(paymentData.refId) : 0)}
                                </span>
                            </div>
                            {paymentData.cardPan && (
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">شماره کارت:</span>
                                    <span className="font-mono text-gray-800">
                                        {paymentData.cardPan}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="text-center text-xs text-gray-400 bg-blue-50 p-3 rounded-lg">
                            <Receipt className="w-4 h-4 inline-block ml-1" />
                            کد پیگیری را برای پیگیری سفارش یادداشت کنید
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-3">
                            <Button
                                className="w-full h-12 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold"
                                onClick={() => router.push("/orders")}
                            >
                                مشاهده سفارشات من
                                <ArrowRight className="mr-2 h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full h-12 rounded-xl"
                                onClick={() => router.push("/")}
                            >
                                بازگشت به صفحه اصلی
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Error state
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md border-none shadow-lg">
                <CardHeader className="text-center pb-4">
                    <div className="bg-red-100 p-4 rounded-full w-fit mx-auto mb-4">
                        <XCircle className="w-16 h-16 text-red-600" />
                    </div>
                    <CardTitle className="text-2xl text-red-600">
                        پرداخت ناموفق
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <p className="text-center text-gray-600">
                        {error || "متأسفانه پرداخت شما انجام نشد"}
                    </p>

                    <div className="text-center text-xs text-gray-400 bg-amber-50 p-3 rounded-lg">
                        سفارش شما ثبت شده اما در انتظار پرداخت است
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3">
                        <Button
                            className="w-full h-12 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold"
                            onClick={() => router.push("/orders")}
                        >
                            مشاهده سفارشات
                            <ArrowRight className="mr-2 h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full h-12 rounded-xl"
                            onClick={() => router.push("/")}
                        >
                            بازگشت به صفحه اصلی
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
