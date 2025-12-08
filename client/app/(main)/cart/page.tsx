// FILE: app/(main)/cart/page.tsx (UNIFIED FOOTER STYLE)
"use client";

import { useState, useEffect } from "react";
import { useAppContext } from "@/context/AppContext";
import apiClient from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errors";
import type { Settlement } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { useSimpleToast } from "@/components/ui/toast-notification";
import Image from "next/image";
import { Plus, Minus, Trash2, CalendarIcon, Loader2, StickyNote, Banknote, ArrowRight, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ShamsiCalendar } from "@/components/shared/ShamsiCalendar";
import toPersianDigits from "@/utils/numberFormatter";
import { formatToToman } from "@/utils/currencyFormatter";

const getTodayDateString = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export default function CartPage() {
    const { cart, updateCartQuantity, getTotalPrice, getOriginalTotalPrice, clearCart } = useAppContext();
    const router = useRouter();
    const toast = useSimpleToast();

    const [isCheckout, setIsCheckout] = useState(false);
    const [settlements, setSettlements] = useState<Settlement[]>([]);
    const [selectedSettlement, setSelectedSettlement] = useState<string>("");
    const [deliveryDate, setDeliveryDate] = useState<string>(getTodayDateString());
    const [notes, setNotes] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSettlements = async () => {
            try {
                const response = await apiClient.get('/settlements');
                setSettlements(response.data);
                if (response.data.length > 0) {
                    setSelectedSettlement(response.data[0].id);
                }
            } catch (err) {
                console.error("Failed to fetch settlements", err);
                setError("خطا در دریافت نحوه تسویه حساب.");
            }
        };
        if (isCheckout) {
            fetchSettlements();
        }
    }, [isCheckout]);

    const handleOrderSubmit = async () => {
        if (!selectedSettlement) {
            toast.error("لطفا نحوه تسویه حساب را انتخاب کنید.");
            return;
        }
        if (cart.length === 0) {
            toast.warning("سبد خرید شما خالی است.");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const orderData = {
                items: cart.map(item => {
                    const discountedPrice = item.price * (1 - (item.discountPercentage || 0) / 100);
                    return {
                        productId: item.id,
                        productName: item.name,
                        quantity: item.quantity,
                        price: discountedPrice,
                    };
                }),
                totalPrice: getTotalPrice(),
                deliveryDate,
                settlementId: selectedSettlement,
                notes,
            };

            await apiClient.post('/orders', orderData);
            clearCart();
            toast.success("سفارش شما با موفقیت ثبت شد!");
            router.push('/orders');

        } catch (error: unknown) {
            setError(getErrorMessage(error, "خطا در ثبت سفارش"));
            toast.error(getErrorMessage(error, "خطا در ثبت سفارش"));
        } finally {
            setIsLoading(false);
        }
    };

    // --- EMPTY STATE ---
    if (cart.length === 0 && !isCheckout) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-8">
                <div className="bg-green-50 p-6 rounded-full mb-6 animate-in zoom-in duration-300">
                    <ShoppingCart className="w-16 h-16 text-green-200" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">سبد خرید شما خالی است</h2>
                <p className="text-gray-500 mb-8 max-w-xs">محصولات مورد علاقه خود را به سبد خرید اضافه کنید.</p>
                <Button className="bg-green-600 hover:bg-green-700 text-white h-12 px-8 rounded-xl shadow-lg shadow-green-200" onClick={() => router.push('/')}>
                    شروع خرید
                </Button>
            </div>
        );
    }

    // --- PHASE 2: CHECKOUT VIEW ---
    if (isCheckout) {
        return (
            <div className="min-h-screen bg-gray-50 pb-40">
                <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b px-4 py-3 flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => setIsCheckout(false)} className="rounded-full">
                        <ArrowRight className="text-gray-600" />
                    </Button>
                    <span className="font-bold text-gray-800">تکمیل سفارش</span>
                </header>

                <div className="p-4 space-y-4 max-w-lg mx-auto">
                    <Card className="border-none shadow-sm gap-2 py-4">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2 text-green-700"><CalendarIcon size={18} /> زمان تحویل</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ShamsiCalendar onSelectDate={setDeliveryDate} initialDate={deliveryDate} />
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2 text-green-700"><Banknote size={18} /> نحوه پرداخت</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Select value={selectedSettlement} onValueChange={setSelectedSettlement}>
                                <SelectTrigger className="h-12 rounded-xl bg-gray-50 border-gray-200"><SelectValue placeholder="انتخاب کنید..." /></SelectTrigger>
                                <SelectContent>{settlements.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2 text-green-700"><StickyNote size={18} /> یادداشت شما</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="توضیحات تکمیلی برای سفارش (اختیاری)..."
                                className="min-h-[100px] rounded-xl bg-gray-50 border-gray-200 focus:bg-white"
                            />
                        </CardContent>
                    </Card>

                    {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm text-center border border-red-100">{error}</div>}
                </div>

                {/* FOOTER PHASE 2 */}
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-50 shadow-[0_-4px_30px_rgba(0,0,0,0.1)]">
                    <div className="max-w-lg mx-auto flex gap-3 items-center">
                        <div className="flex-1 flex flex-col justify-center">
                            <span className="text-[10px] text-gray-400">مبلغ قابل پرداخت</span>
                            <div className="flex items-center gap-1">
                                <span className="font-bold text-lg text-gray-800">{formatToToman(getTotalPrice())}</span>
                            </div>
                        </div>
                        <Button
                            className="flex-[2] h-12 rounded-xl bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200 text-md font-bold"
                            onClick={handleOrderSubmit}
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader2 className="animate-spin" /> : "تایید و ثبت نهایی"}
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    // --- PHASE 1: CART VIEW ---
    return (
        <div className="min-h-screen bg-gray-50 pb-40">
            <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full -mr-2">
                        <ArrowRight className="text-gray-600" />
                    </Button>
                    <h1 className="font-bold text-gray-800 flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5 text-green-600" />
                        سبد خرید
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{toPersianDigits(cart.length)}</span>
                    </h1>
                </div>
                {cart.length > 0 && (
                    <Button variant="ghost" size="sm" className="text-red-500 h-8 text-xs hover:bg-red-50" onClick={clearCart}>
                        <Trash2 size={14} className="mr-1" />
                        حذف همه
                    </Button>
                )}
            </header>

            <div className="p-4 space-y-3">
                {cart.map(item => {
                    const finalPrice = item.price * (1 - (item.discountPercentage || 0) / 100);
                    const lineItemTotal = finalPrice * item.quantity;

                    return (
                        <div key={item.id} className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex gap-3 items-start">
                            <div className="w-20 h-20 bg-gray-50 rounded-xl flex-shrink-0 overflow-hidden relative">
                                <Image src={item.image || "/placeholder.jpg"} alt={item.name} fill className="object-contain p-1" />
                            </div>

                            <div className="flex-1 flex flex-col justify-between min-h-[5rem]">
                                <div>
                                    <h3 className="font-bold text-sm text-gray-800 line-clamp-2 leading-tight mb-1">{item.name}</h3>
                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                        {item.discountPercentage > 0 && (
                                            <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                                %{toPersianDigits(item.discountPercentage)}
                                            </span>
                                        )}
                                        <span>فی: {formatToToman(finalPrice)}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mt-2">
                                    <div className="flex items-center bg-gray-50 rounded-lg p-0.5 border border-gray-100">
                                        <Button size="icon" variant="ghost" className="h-7 w-7 rounded-md hover:bg-white hover:shadow-sm" onClick={() => updateCartQuantity(item.id, item.quantity + 1)}>
                                            <Plus size={14} className="text-green-600" />
                                        </Button>
                                        <span className="w-8 text-center font-bold text-sm text-gray-700">{toPersianDigits(item.quantity)}</span>
                                        <Button size="icon" variant="ghost" className="h-7 w-7 rounded-md hover:bg-white hover:shadow-sm" onClick={() => updateCartQuantity(item.id, item.quantity - 1)}>
                                            {item.quantity === 1 ? <Trash2 size={14} className="text-red-500" /> : <Minus size={14} className="text-gray-600" />}
                                        </Button>
                                    </div>
                                    <span className="font-bold text-green-700 text-sm">
                                        {formatToToman(lineItemTotal)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* FOOTER PHASE 1: Now identical style to Phase 2 */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-50 shadow-[0_-4px_30px_rgba(0,0,0,0.1)]">
                <div className="max-w-lg mx-auto flex gap-3 items-center">
                    <div className="flex-1 flex flex-col justify-center">
                        {/* Profit info added nicely above price */}
                        {getOriginalTotalPrice() - getTotalPrice() > 0 && (
                            <div className="flex items-center gap-1 text-[10px] text-gray-400 mb-0.5">
                                <span>سود شما:</span>
                                <span className="text-red-500 font-bold">{formatToToman(getOriginalTotalPrice() - getTotalPrice())}</span>
                            </div>
                        )}
                        {!((getOriginalTotalPrice() - getTotalPrice() > 0)) && <span className="text-[10px] text-gray-400">مبلغ قابل پرداخت</span>}

                        <div className="flex items-center gap-1">
                            <span className="font-bold text-lg text-gray-800">{formatToToman(getTotalPrice())}</span>
                        </div>
                    </div>

                    <Button
                        className="flex-[2] h-12 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg shadow-green-200 text-md active:scale-[0.98] transition-all"
                        onClick={() => setIsCheckout(true)}
                    >
                        ثبت سفارش <ArrowRight className="mr-2 h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
