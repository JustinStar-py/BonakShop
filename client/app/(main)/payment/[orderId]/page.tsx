"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, CreditCard, ShoppingBag, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import apiClient from "@/lib/apiClient";
import { formatToToman } from "@/utils/currencyFormatter";
import toPersianDigits from "@/utils/numberFormatter";

export default function PaymentPage() {
    const params = useParams();
    const router = useRouter();
    const orderId = params.orderId as string;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [orderData, setOrderData] = useState<any>(null);

    useEffect(() => {
        if (!orderId) {
            setError("شناسه سفارش نامعتبر است");
            setLoading(false);
            return;
        }

        initiatePayment();
    }, [orderId]);

    const initiatePayment = async () => {
        try {
            setLoading(true);
            setError(null);

            // Call payment request API
            const response = await apiClient.post("/payment/request", { orderId });

            if (response.data.success && response.data.redirectUrl) {
                // Redirect to Zarinpal
                window.location.href = response.data.redirectUrl;
            } else {
                setError("خطا در ایجاد درخواست پرداخت");
            }
        } catch (err: any) {
            console.error("Payment initiation error:", err);
            setError(err.response?.data?.error || "خطا در برقراری ارتباط با درگاه پرداخت");
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md border-none shadow-lg">
                    <CardContent className="pt-6 pb-6">
                        <div className="flex flex-col items-center gap-4 text-center">
                            <div className="bg-green-100 p-4 rounded-full animate-pulse">
                                <CreditCard className="w-12 h-12 text-green-600" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-800">
                                در حال انتقال به درگاه پرداخت...
                            </h2>
                            <p className="text-gray-500 text-sm">
                                لطفاً صبر کنید، شما به درگاه امن زرین‌پال منتقل می‌شوید
                            </p>
                            <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md border-none shadow-lg">
                    <CardHeader className="text-center">
                        <div className="bg-red-100 p-4 rounded-full w-fit mx-auto mb-4">
                            <AlertCircle className="w-12 h-12 text-red-600" />
                        </div>
                        <CardTitle className="text-xl text-red-600">خطا در پرداخت</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-center text-gray-600">{error}</p>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1 h-12 rounded-xl"
                                onClick={() => router.push("/orders")}
                            >
                                مشاهده سفارشات
                            </Button>
                            <Button
                                className="flex-1 h-12 rounded-xl bg-green-600 hover:bg-green-700"
                                onClick={initiatePayment}
                            >
                                تلاش مجدد
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return null;
}
