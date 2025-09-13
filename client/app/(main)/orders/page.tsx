// FILE: app/(main)/orders/page.tsx (Updated Layout)
"use client";

import { useState, useEffect } from "react";
import apiClient from "@/lib/apiClient";
import type { Order, OrderItem, OrderStatus } from "@prisma/client";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
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
import { RefreshCw, XCircle, Calendar, StickyNote } from "lucide-react";
import { ReturnRequestDialog } from "@/components/shared/ReturnRequestDialog";

// --- Type Definitions ---
type OrderWithItems = Order & {
    items: OrderItem[];
    returnRequest: { id: string } | null;
};

// --- Helper Functions ---
const getStatusVariant = (status: string) => {
    switch (status) {
        case 'PENDING': return 'default';
        case 'SHIPPED': return 'secondary';
        case 'DELIVERED': return 'success';
        case 'CANCELED': return 'destructive';
        default: return 'outline';
    }
};

const translateStatus = (status: string) => {
    const translations: { [key: string]: string } = {
        PENDING: "در انتظار تایید",
        SHIPPED: "ارسال شده",
        DELIVERED: "تحویل شده",
        CANCELED: "لغو شده",
    };
    return translations[status] || status;
};

// --- Main Component ---
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
            const sortedOrders = response.data.sort((a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
            alert("سفارش با موفقیت لغو شد.");
            fetchOrders(); // Refresh the list
        } catch (e: any) {
            alert(e.response?.data?.error || "خطا در لغو سفارش");
        }
    };

    if (isLoading) {
        return <LoadingSpinner message="در حال بارگذاری سفارشات..." />;
    }

    if (error) {
        return <div className="text-center text-red-500 p-4">{error}</div>;
    }

    if (orders.length === 0) {
        return (
            <div className="text-center p-8">
                <h2 className="text-2xl font-bold mb-4">هیچ سفارشی ثبت نکرده‌اید</h2>
                <Button onClick={() => router.push('/')}>شروع خرید</Button>
            </div>
        );
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold text-right mb-6">تاریخچه سفارشات</h1>
            <Accordion type="single" collapsible className="w-full space-y-4">
                {orders.map((order, index) => (
                    <AccordionItem key={order.id} value={order.id} className="bg-white rounded-lg shadow-sm border data-[state=open]:shadow-md">
                        <AccordionTrigger className="w-full text-right px-4 py-3 hover:no-underline">
                            <div className="flex justify-between items-center w-full">
                                <div className="flex flex-col items-start gap-1">
                                    <span className="font-semibold">سفارش {index + 1}#</span>
                                    <span className="text-xs text-gray-500">
                                        ثبت: {new Date(order.createdAt).toLocaleDateString('fa-IR')}
                                    </span>
                                </div>
                                <Badge variant={getStatusVariant(order.status) as any}>{translateStatus(order.status)}</Badge>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                            <div className="pt-3 border-t space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-semibold text-gray-600">مجموع مبلغ:</span>
                                    <span className="font-bold text-lg">{order.totalPrice.toLocaleString()} تومان</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-semibold text-gray-600 flex items-center gap-2"><Calendar size={16} /> تاریخ تحویل:</span>
                                    <span className="font-semibold">{new Date(order.deliveryDate).toLocaleDateString('fa-IR')}</span>
                                </div>

                                {order.notes && (
                                    <div className="text-sm text-gray-700 bg-yellow-50 p-2 rounded-md border border-yellow-200">
                                        <p className="font-semibold flex items-center gap-2"><StickyNote size={16} /> توضیحات:</p>
                                        <p className="pt-1">{order.notes}</p>
                                    </div>
                                )}
                                
                                <h4 className="font-semibold mb-2 pt-2">اقلام سفارش:</h4>
                                <ul className="space-y-2">
                                    {order.items.map((item: OrderItem) => (
                                        <li key={item.id} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded-md">
                                            <span>{item.productName}</span>
                                            <span className="text-gray-600">تعداد: {item.quantity}</span>
                                        </li>
                                    ))}
                                </ul>
                                
                                <div className="flex flex-wrap gap-2 pt-4 border-t">
                                    {/* --- UPDATED BUTTONS SECTION --- */}
                                    {order.status === 'PENDING' && (
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" size="sm" className="gap-2"><XCircle size={16}/> لغو سفارش</Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader><AlertDialogTitle>آیا از لغو سفارش اطمینان دارید؟</AlertDialogTitle></AlertDialogHeader>
                                                <AlertDialogDescription>این عمل غیرقابل بازگشت است.</AlertDialogDescription>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>انصراف</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleCancelOrder(order.id)}>تایید و لغو</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    )}

                                    {order.status === 'DELIVERED' && !order.returnRequest && (
                                        <Button variant="outline" size="sm" className="gap-2 text-orange-600 border-orange-400 hover:bg-orange-50 hover:text-orange-700" onClick={() => setSelectedOrderForReturn(order)}>
                                            <RefreshCw size={16}/> ثبت مرجوعی
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