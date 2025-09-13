// FILE: app/(main)/cart/page.tsx (With Responsive Checkout View)
"use client";

import { useState, useEffect } from "react";
import { useAppContext } from "@/context/AppContext";
import apiClient from "@/lib/apiClient";
import type { Settlement } from "@prisma/client";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Plus, Minus, Trash2, CalendarIcon, Loader2, StickyNote, Banknote } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ShamsiCalendar } from "@/components/shared/ShamsiCalendar";
import { Label } from "@/components/ui/label"; // Import Label component

export default function CartPage() {
    const { cart, updateCartQuantity, removeFromCart, getTotalPrice, getOriginalTotalPrice, clearCart } = useAppContext();
    const router = useRouter();

    const [isCheckout, setIsCheckout] = useState(false);
    const [settlements, setSettlements] = useState<Settlement[]>([]);
    const [selectedSettlement, setSelectedSettlement] = useState<string>("");
    const [deliveryDate, setDeliveryDate] = useState<Date>(new Date());
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
        if (isCheckout) { // Fetch settlements only when needed
            fetchSettlements();
        }
    }, [isCheckout]);

    const handleOrderSubmit = async () => {
        if (!selectedSettlement) {
            alert("لطفا نحوه تسویه حساب را انتخاب کنید.");
            return;
        }
        if (cart.length === 0) {
            alert("سبد خرید شما خالی است.");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const orderData = {
                items: cart.map(item => ({
                    productId: item.id,
                    quantity: item.quantity,
                    price: item.price,
                    productName: item.name
                })),
                totalPrice: getTotalPrice(),
                deliveryDate,
                settlementId: selectedSettlement,
                notes,
            };

            await apiClient.post('/orders', orderData);
            alert("سفارش شما با موفقیت ثبت شد!");
            clearCart();
            router.push('/orders');

        } catch (e: any) {
            setError(e.response?.data?.error || "خطا در ثبت سفارش");
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };


    if (cart.length === 0 && !isCheckout) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8">
                <h2 className="text-2xl font-bold mb-4">سبد خرید شما خالی است</h2>
                <Button onClick={() => router.push('/')}>بازگشت به فروشگاه</Button>
            </div>
        );
    }
    
    // --- Checkout View ---
    if (isCheckout) {
        return (
            // FIX: Use smaller padding on mobile (p-2) and larger on bigger screens (sm:p-4)
            <div className="p-2 sm:p-4 space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>نهایی کردن سفارش</CardTitle>
                        <CardDescription>تاریخ تحویل و نحوه تسویه را مشخص کنید.</CardDescription>
                    </CardHeader>
                    {/* FIX: Use smaller padding inside the card for mobile */}
                    <CardContent className="p-3 sm:p-6 space-y-4">
                        <div>
                            <Label className="mb-2 flex items-center gap-2 text-sm font-semibold"><CalendarIcon size={16}/> تاریخ تحویل</Label>
                            <ShamsiCalendar onSelectDate={setDeliveryDate} initialDate={deliveryDate} />
                        </div>
                        <div>
                            <Label className="mb-2 flex items-center gap-2 text-sm font-semibold"><Banknote size={16}/> نحوه تسویه</Label>
                            <Select value={selectedSettlement} onValueChange={setSelectedSettlement}>
                                <SelectTrigger>
                                    <SelectValue placeholder="انتخاب کنید..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {settlements.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="mb-2 flex items-center gap-2 text-sm font-semibold"><StickyNote size={16}/> توضیحات (اختیاری)</Label>
                            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="توضیحات مربوط به سفارش خود را اینجا بنویسید..."/>
                        </div>
                    </CardContent>
                </Card>
                {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" onClick={() => setIsCheckout(false)}>بازگشت به سبد</Button>
                    <Button onClick={handleOrderSubmit} disabled={isLoading}>
                        {isLoading ? <Loader2 className="animate-spin" /> : "ثبت نهایی سفارش"}
                    </Button>
                </div>
            </div>
        )
    }

    // --- Cart View ---
    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold text-right mb-6">سبد خرید</h1>
            <div className="space-y-4">
                {cart.map(item => (
                    <div key={item.id} className="flex flex-col justify-between p-3 bg-white rounded-lg shadow">
                        <div className="flex items-center gap-4">
                            <Image src={item.image || "/placeholder.jpg"} alt={item.name} width={64} height={64} className="rounded-md object-cover"/>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold truncate">{item.name}</h3>
                                <p className="text-sm text-gray-600">{item.price.toLocaleString()} تومان</p>
                            </div>
                        </div>
                        <div className="w-full h-px bg-gray-300 my-2"></div>
                        <div className="flex place-content-between gap-2 sm:gap-3">
                            <div>
                                <Button size="icon" variant="ghost" className="h-8 w-8 sm:h-9 sm:w-9" onClick={() => updateCartQuantity(item.id, item.quantity + 1)}><Plus size={16}/></Button>
                                <span className="font-bold">{item.quantity}</span>
                                <Button size="icon" variant="ghost" className="h-8 w-8 sm:h-9 sm:w-9" onClick={() => updateCartQuantity(item.id, item.quantity - 1)}><Minus size={16}/></Button>
                            </div>
                            <div>
                            <Button size="icon" variant="destructive" className="h-8 w-8 sm:h-9 sm:w-9" onClick={() => removeFromCart(item.id)}><Trash2 size={16}/></Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-8 p-4 bg-gray-50 rounded-lg space-y-3">
                <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>مجموع (با تخفیف):</span>
                    <span>{getOriginalTotalPrice().toLocaleString()} تومان</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="font-semibold">مبلغ نهایی فاکتور:</span>
                    <span className="text-md font-bold">{getTotalPrice().toLocaleString()} تومان</span>
                </div>
                <Button className="w-full mt-4" size="lg" onClick={() => setIsCheckout(true)}>ادامه فرآیند خرید</Button>
            </div>
        </div>
    );
}