// FILE: app/delivery/page.tsx
// FINAL VERSION: Complete redesign with separate tabs for Orders and Returns, and detailed cards.
"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from 'next/dynamic';
import { useRouter } from "next/navigation";
import { Truck, CheckCircle, Loader2, LogOut, FileText, ArrowRight, MapPin, Phone, Building, User as UserIcon, RefreshCw, Package, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppContext } from "@/context/AppContext";
import type { Order, ReturnRequest, OrderItem, ReturnRequestItem, OrderStatus, ReturnStatus } from "@prisma/client";
import { LatLngTuple } from "leaflet";

// --- Type Definitions ---
type OrderForDelivery = Order & {
  user: { name: string | null; shopName: string | null; shopAddress: string | null; phone: string; latitude: number | null; longitude: number | null; };
  items: OrderItem[];
};

type ReturnForDelivery = ReturnRequest & {
    order: { user: { name: string | null; shopName: string | null; shopAddress: string | null; phone: string; }};
    items: (ReturnRequestItem & { orderItem: { productName: string } })[];
}

const MapPicker = dynamic(() => import('@/components/shared/MapPicker'), {
    ssr: false,
    loading: () => <div className="h-64 w-full bg-gray-200 animate-pulse rounded-md flex items-center justify-center"><p>در حال بارگذاری نقشه...</p></div>
});

// --- Utility Functions ---
const formatPrice = (p: number) => p.toLocaleString("fa-IR", { useGrouping: false }) + " ریال";

const getOrderStatusInfo = (status: OrderStatus): { text: string; variant: "default" | "secondary" | "destructive" } => {
    const map = { 
        PENDING: { text: "در حال بررسی", variant: "secondary" as "secondary" }, 
        SHIPPED: { text: "ارسال شده", variant: "default" as "default" }, 
        DELIVERED: { text: "تحویل داده شد", variant: "default" as "default" }, 
        CANCELED: { text: "لغو شده", variant: "destructive" as "destructive" } 
    };
    return map[status];
};

const getReturnStatusInfo = (status: ReturnStatus): { text: string; variant: "default" | "secondary" | "destructive" } => {
    const map = { 
        REQUESTED: { text: "درخواست شده", variant: "secondary" as "secondary" }, 
        APPROVED: { text: "تایید شده", variant: "default" as "default" }, 
        REJECTED: { text: "رد شده", variant: "destructive" as "destructive" } 
    };
    return map[status];
};


// --- Main Component ---
export default function DeliveryPage() {
    const { user, setUser, isLoadingUser } = useAppContext();
    const router = useRouter();
    const [allOrders, setAllOrders] = useState<OrderForDelivery[]>([]);
    const [allReturns, setAllReturns] = useState<ReturnForDelivery[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [ordersRes, returnsRes] = await Promise.all([
                fetch('/api/delivery-orders'),
                fetch('/api/returns')
            ]);
            if (ordersRes.ok) setAllOrders(await ordersRes.json());
            if (returnsRes.ok) setAllReturns(await returnsRes.json());
        } catch (error) { 
            console.error("Failed to fetch data", error);
        } finally { 
            setIsLoading(false); 
        }
    };
    
    useEffect(() => {
        if (!isLoadingUser && (!user || (user.role !== 'WORKER' && user.role !== 'ADMIN'))) router.replace('/');
        if(user && (user.role === 'WORKER' || user.role === 'ADMIN')) fetchData();
    }, [user, isLoadingUser, router]);

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            setUser(null);
            router.push('/');
        } catch(e) { console.error(e) }
    };
    
    if (isLoadingUser || !user) {
        return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="min-h-screen bg-gray-100 font-sans" dir="rtl">
             <header className="sticky top-0 bg-white z-10 p-4 border-b flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold">پنل مدیریت و تحویل</h1>
                    <p className="text-sm text-muted-foreground">سلام، {user.name}</p>
                </div>
                <div>
                    {user.role === 'ADMIN' && (<Button variant="ghost" onClick={() => router.push('/admin/dashboard')} className="ml-2"><ArrowRight className="ml-2 h-4 w-4" />داشبورد</Button>)}
                    <Button variant="ghost" size="icon" onClick={handleLogout} className="text-red-500"><LogOut className="h-5 w-5" /></Button>
                </div>
            </header>
            <main className="p-4">
                <Tabs defaultValue="orders" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="orders">سفارشات</TabsTrigger>
                        <TabsTrigger value="returns">مرجوعی‌ها</TabsTrigger>
                    </TabsList>
                    <TabsContent value="orders" className="pt-4">
                        <OrdersPanel orders={allOrders} isLoading={isLoading} refreshData={fetchData} />
                    </TabsContent>
                    <TabsContent value="returns" className="pt-4">
                        <ReturnsPanel returns={allReturns} isLoading={isLoading} refreshData={fetchData} />
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}

// --- Orders Panel Component ---
function OrdersPanel({orders, isLoading, refreshData}: {orders: OrderForDelivery[], isLoading: boolean, refreshData: () => void}) {
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const handleStatusChange = async (orderId: string, status: OrderStatus) => {
        setActionLoading(orderId);
        try {
            const res = await fetch(`/api/orders/${orderId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (!res.ok) throw new Error("خطا در به‌روزرسانی وضعیت");
            await refreshData(); 
        } catch (error) {
            alert((error as Error).message);
        } finally {
            setActionLoading(null);
        }
    };

    if (isLoading) return <div className="text-center pt-10"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>;
    if (orders.length === 0) return <div className="text-center pt-10 text-gray-500"><Package className="mx-auto h-12 w-12" /><p className="mt-4">هیچ سفارشی یافت نشد.</p></div>;

    return (
        <div className="space-y-4">
            {orders.map(order => (
                <Card key={order.id}>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <CardTitle className="text-base font-bold">{order.user.shopName || order.user.name}</CardTitle>
                            <Badge variant={getOrderStatusInfo(order.status).variant}>{getOrderStatusInfo(order.status).text}</Badge>
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground pt-2">
                            <p className="flex items-center gap-2"><UserIcon className="h-4 w-4" />{order.user.name}</p>
                            <p className="flex items-center gap-2"><Building className="h-4 w-4" />{order.user.shopAddress}</p>
                            <p className="flex items-center gap-2"><Phone className="h-4 w-4" />{order.user.phone}</p>
                        </div>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2">
                        <div className="flex gap-2">
                            <Dialog><DialogTrigger asChild><Button variant="outline" className="w-full"><FileText className="ml-2 h-4 w-4"/>فاکتور</Button></DialogTrigger><DialogContent className="max-w-sm"><CardHeader><CardTitle>فاکتور سفارش</CardTitle><CardDescription>شماره: ...{order.id.slice(-6)}</CardDescription></CardHeader><CardContent className="space-y-3 text-sm">{order.items.map(item => (<div key={item.id} className="flex justify-between"><span>{item.productName} (×{item.quantity})</span><span>{formatPrice(item.price * item.quantity)}</span></div>))}<Separator /><div className="flex justify-between font-bold"><span>مبلغ کل:</span><span>{formatPrice(order.totalPrice)}</span></div></CardContent></DialogContent></Dialog>
                            {order.user.latitude && order.user.longitude && <Dialog><DialogTrigger asChild><Button variant="outline" className="w-full"><MapPin className="ml-2 h-4 w-4"/>نقشه</Button></DialogTrigger><DialogContent><MapPicker readOnly marker={{ position: [order.user.latitude, order.user.longitude], popupText: order.user.shopName || 'موقعیت'}}/></DialogContent></Dialog>}
                        </div>
                        <div className="flex items-center gap-2">
                            <Select onValueChange={(value) => handleStatusChange(order.id, value as OrderStatus)} defaultValue={order.status} disabled={actionLoading === order.id}><SelectTrigger className="w-full"><SelectValue placeholder="تغییر وضعیت..." /></SelectTrigger><SelectContent><SelectItem value="PENDING">در حال بررسی</SelectItem><SelectItem value="SHIPPED">ارسال شده</SelectItem><SelectItem value="DELIVERED">تحویل داده شد</SelectItem><SelectItem value="CANCELED">لغو شده</SelectItem></SelectContent></Select>
                            {actionLoading === order.id && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

// --- Returns Panel Component ---
function ReturnsPanel({returns, isLoading, refreshData}: {returns: ReturnForDelivery[], isLoading: boolean, refreshData: () => void}) {
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const handleStatusChange = async (returnId: string, status: ReturnStatus) => {
        setActionLoading(returnId);
        try {
            const res = await fetch(`/api/returns/${returnId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (!res.ok) throw new Error("خطا در به‌روزرسانی وضعیت مرجوعی");
            await refreshData(); 
        } catch (error) {
            alert((error as Error).message);
        } finally {
            setActionLoading(null);
        }
    };

    if (isLoading) return <div className="text-center pt-10"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>;
    if (returns.length === 0) return <div className="text-center pt-10 text-gray-500"><RefreshCw className="mx-auto h-12 w-12" /><p className="mt-4">هیچ درخواست مرجوعی یافت نشد.</p></div>;

    return (
        <div className="space-y-4">
            {returns.map((ret: ReturnForDelivery) => (
                <Card key={ret.id}>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <CardTitle className="text-base font-bold">{ret.order.user.shopName || ret.order.user.name}</CardTitle>
                            <Badge variant={getReturnStatusInfo(ret.status).variant}>{getReturnStatusInfo(ret.status).text}</Badge>
                        </div>
                        <CardDescription>فروشنده: {ret.order.user.name}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm space-y-2">
                            <p className="font-semibold">اقلام مرجوعی:</p>
                            <ul className="list-disc list-inside bg-gray-50 p-2 rounded-md">
                                {ret.items.map(item => <li key={item.id}>{item.orderItem.productName} (تعداد: {item.quantity})</li>)}
                            </ul>
                            {ret.reason && <p><span className="font-semibold">دلیل:</span> {ret.reason}</p>}
                        </div>
                        <div className="flex items-center gap-2 mt-4">
                            <Select onValueChange={(value) => handleStatusChange(ret.id, value as ReturnStatus)} defaultValue={ret.status} disabled={actionLoading === ret.id}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="REQUESTED">درخواست شده</SelectItem><SelectItem value="APPROVED">تایید شده</SelectItem><SelectItem value="REJECTED">رد شده</SelectItem></SelectContent></Select>
                            {actionLoading === ret.id && <Loader2 className="h-5 w-5 animate-spin" />}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
