"use client";

import { useState, useEffect } from "react";
import apiClient from "@/lib/apiClient";
import type { Order, OrderItem } from "@prisma/client";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";
import { RefreshCw, XCircle, StickyNote, CalendarCheck, ShoppingBag } from "lucide-react";
import { ReturnRequestDialog } from "@/components/shared/ReturnRequestDialog";
import toPersianDigits from "@/utils/numberFormatter";
import OrderCard from "@/components/shared/OrderCard"; // ایمپورت کارت جدید
import { formatToToman } from "@/utils/currencyFormatter";

// تایپ‌های مورد نیاز
type OrderWithItems = Order & {
    items: OrderItem[];
    returnRequest: { id: string } | null;
};

export default function OrdersPage() {
    const [orders, setOrders] = useState<OrderWithItems[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedOrderForReturn, setSelectedOrderForReturn] = useState<OrderWithItems | null>(null);
    const router = useRouter();

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const response = await apiClient.get('/orders');
            // مرتب‌سازی بر اساس جدیدترین
            const sortedOrders = response.data.sort((a: Order, b: Order) => 
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            setOrders(sortedOrders);
        } catch (err) {
            setError("خطا در دریافت تاریخچه سفارشات.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleCancelOrder = async (orderId: string) => {
        try {
            await apiClient.patch(`/orders/${orderId}/status`, { status: "CANCELED" });
            fetchOrders(); 
        } catch (e: any) {
            alert(e.response?.data?.error || "خطا در لغو سفارش");
        }
    };

    if (isLoading) return <LoadingSpinner message="در حال بارگذاری سفارشات..." />;
    
    if (error) return <div className="text-center text-red-500 p-8">{error}</div>;

    if (orders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] p-4">
                <div className="bg-green-50 p-6 rounded-full mb-4">
                    <ShoppingBag className="w-12 h-12 text-green-500" />
                </div>
                <h2 className="text-lg font-bold text-gray-700 mb-2">هنوز سفارشی ثبت نکرده‌اید</h2>
                <p className="text-gray-400 text-sm mb-6 text-center">محصولات متنوع ما را مشاهده کنید و اولین سفارش خود را ثبت کنید.</p>
                <Button className="bg-green-600 text-white rounded-xl h-12 px-8" onClick={() => router.push('/')}>
                    شروع خرید
                </Button>
            </div>
        );
    }

    return (
        <div className="pb-24 min-h-screen bg-gray-50 p-4">
            <h1 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                <CalendarCheck className="w-6 h-6 text-green-600"/>
                تاریخچه سفارشات
            </h1>

            <Accordion type="single" collapsible className="w-full space-y-3">
                {orders.map((order) => (
                    <AccordionItem 
                        key={order.id} 
                        value={order.id} 
                        className="border-none" // حذف بوردر پیش‌فرض آکاردئون چون کارت خودش بوردر دارد
                    >
                        {/* اینجا از OrderCard به عنوان تریگر استفاده می‌کنیم */}
                        <AccordionTrigger className="p-0 hover:no-underline [&[data-state=open]>div]:ring-2 [&[data-state=open]>div]:ring-green-500">
                            <OrderCard order={order} />
                        </AccordionTrigger>
                        
                        <AccordionContent className="px-1 py-2">
                            <div className="bg-white rounded-xl border border-gray-200 p-4 mt-2 shadow-inner">
                                <div className="flex justify-between items-center text-sm mb-3 pb-3 border-b border-dashed">
                                    <span className="text-gray-500">تاریخ تحویل مقرر:</span>
                                    <span className="font-medium text-gray-800">
                                        {new Date(order.deliveryDate).toLocaleDateString('fa-IR')}
                                    </span>
                                </div>

                                {order.notes && (
                                    <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 mb-4">
                                        <div className="flex items-center gap-2 text-yellow-700 text-xs font-bold mb-1">
                                            <StickyNote size={14} />
                                            توضیحات شما:
                                        </div>
                                        <p className="text-xs text-gray-700 leading-relaxed">{order.notes}</p>
                                    </div>
                                )}
                                
                                <h4 className="font-bold text-sm text-gray-700 mb-3">اقلام سفارش:</h4>
                                <div className="space-y-2 mb-4">
                                    {order.items.map((item: OrderItem) => (
                                        <div key={item.id} className="flex justify-between items-center text-xs bg-gray-50 p-2 rounded-lg">
                                            <span className="text-gray-700 truncate ml-2">{item.productName}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-500">{formatToToman(item.price)}</span>
                                                <span className="bg-white border px-2 py-0.5 rounded text-gray-800 font-bold">
                                                    {toPersianDigits(item.quantity)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                
                                <div className="flex flex-wrap gap-3 pt-2">
                                    {order.status === 'PENDING' && (
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" className="flex-1 h-10 rounded-xl text-xs">
                                                    <XCircle size={16} className="ml-2"/> لغو سفارش
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>لغو سفارش</AlertDialogTitle>
                                                    <AlertDialogDescription>آیا اطمینان دارید؟ این عملیات قابل بازگشت نیست.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>انصراف</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleCancelOrder(order.id)} className="bg-red-600">
                                                        بله، لغو شود
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    )}

                                    {order.status === 'DELIVERED' && !order.returnRequest && (
                                        <Button 
                                            variant="outline" 
                                            className="flex-1 h-10 rounded-xl text-xs border-orange-300 text-orange-600 hover:bg-orange-50"
                                            onClick={() => setSelectedOrderForReturn(order)}
                                        >
                                            <RefreshCw size={16} className="ml-2"/> درخواست مرجوعی
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>

            <ReturnRequestDialog 
                order={selectedOrderForReturn} 
                onOpenChange={() => setSelectedOrderForReturn(null)} 
                onSuccess={() => {
                    fetchOrders();
                    setSelectedOrderForReturn(null);
                }}
            />
        </div>
    );
}
