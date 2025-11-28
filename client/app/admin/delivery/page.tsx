// FILE: app/admin/delivery/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import type { Order, OrderItem, OrderStatus, ReturnRequest, ReturnRequestItem, ReturnStatus } from "@prisma/client";
import apiClient from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Package, RefreshCw, FileText, MapPin, Phone, Building, User as UserIconLucide } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import dynamic from 'next/dynamic';
import { formatToToman } from "@/utils/toman";

const MapPicker = dynamic(() => import('@/components/shared/MapPicker'), {
    ssr: false,
    loading: () => <div className="h-64 w-full bg-gray-200 animate-pulse rounded-md flex items-center justify-center"><p>در حال بارگذاری نقشه...</p></div>
});

// Type Definitions
type OrderWithRelations = Order & { user: { name: string | null; shopName: string | null; shopAddress: string | null; phone: string; latitude: number | null; longitude: number | null; }, items: OrderItem[] };
type ReturnForDelivery = ReturnRequest & { order: { user: { name: string | null; shopName: string | null; shopAddress: string | null; phone: string; } }, items: (ReturnRequestItem & { orderItem: { productName: string } })[] };

// Helper Functions
const formatPrice = (price: number) => formatToToman(price) || "۰ تومان";
const getOrderStatusInfo = (status: OrderStatus) => ({ PENDING: { text: "در حال بررسی", variant: "secondary" as "secondary" }, SHIPPED: { text: "ارسال شده", variant: "default" as "default" }, DELIVERED: { text: "تحویل داده شد", variant: "default" as "default" }, CANCELED: { text: "لغو شده", variant: "destructive" as "destructive" } }[status]);
const getReturnStatusInfo = (status: ReturnStatus) => ({ REQUESTED: { text: "درخواست شده", variant: "secondary" as "secondary" }, APPROVED: { text: "تایید شده", variant: "default" as "default" }, REJECTED: { text: "رد شده", variant: "destructive" as "destructive" } }[status]);

// Orders Panel Component
function OrdersPanel({orders, isLoading, refreshData}: {orders: OrderWithRelations[], isLoading: boolean, refreshData: () => void}) {
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const handleStatusChange = async (orderId: string, status: OrderStatus) => {
        setActionLoading(orderId);
        try {
            await apiClient.patch(`/orders/${orderId}/status`, { status });
            await refreshData();
        } catch (error) { alert((error as Error).message); }
        finally { setActionLoading(null); }
    };
    const ordersByStatus = useMemo(() => ({
        shipped: orders.filter((o) => o.status === 'SHIPPED'),
        delivered: orders.filter((o) => o.status === 'DELIVERED'),
        others: orders.filter((o) => o.status !== 'SHIPPED' && o.status !== 'DELIVERED')
    }), [orders]);
    const OrderCard = ({ order }: { order: OrderWithRelations }) => (
        <Card className="flex flex-col" dir="rtl">
            <CardHeader>
                <div className="flex justify-between items-start"><CardTitle className="text-base font-bold">{order.user.shopName || order.user.name}</CardTitle><Badge variant={getOrderStatusInfo(order.status).variant}>{getOrderStatusInfo(order.status).text}</Badge></div>
                <div className="text-xs text-muted-foreground space-y-1 pt-2"><p><span className="font-semibold">تاریخ سفارش: </span>{new Date(order.createdAt).toLocaleDateString('fa-IR')}</p><p><span className="font-semibold">تاریخ تحویل: </span>{new Date(order.deliveryDate).toLocaleDateString('fa-IR')}</p></div>
                <div className="space-y-1.5 text-sm text-muted-foreground pt-2 border-t mt-2"><p className="flex items-center gap-2"><UserIconLucide className="h-4 w-4" />{order.user.name}</p><p className="flex items-start gap-2"><Building className="h-4 w-4 mt-1 shrink-0" />{order.user.shopAddress}</p><p className="flex items-center gap-2"><Phone className="h-4 w-4" />{order.user.phone}</p></div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 mt-auto">
                <Dialog><DialogTrigger asChild><Button variant="outline" className="w-full"><FileText className="ml-2 h-4 w-4"/>فاکتور</Button></DialogTrigger><DialogContent className="max-w-sm"><CardHeader><CardTitle>فاکتور سفارش</CardTitle><CardDescription>شماره: ...{order.id.slice(-6)}</CardDescription></CardHeader><CardContent className="space-y-3 text-sm">{order.items.map(item => (<div key={item.id} className="flex justify-between"><span>{item.productName} (×{item.quantity})</span><span>{formatPrice(item.price * item.quantity)}</span></div>))}<Separator /><div className="flex justify-between font-bold"><span>مبلغ کل:</span><span>{formatPrice(order.totalPrice)}</span></div></CardContent></DialogContent></Dialog>
                {order.user.latitude && order.user.longitude && <Dialog><DialogTrigger asChild><Button variant="outline" className="w-full"><MapPin className="ml-2 h-4 w-4"/>نقشه</Button></DialogTrigger><DialogContent><MapPicker readOnly marker={{ position: [order.user.latitude, order.user.longitude], popupText: order.user.shopName || 'موقعیت'}}/></DialogContent></Dialog>}
                <div className="flex items-center gap-2"><Select onValueChange={(value) => handleStatusChange(order.id, value as OrderStatus)} defaultValue={order.status} disabled={actionLoading === order.id}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="PENDING">در حال بررسی</SelectItem><SelectItem value="SHIPPED">ارسال شده</SelectItem><SelectItem value="DELIVERED">تحویل داده شد</SelectItem><SelectItem value="CANCELED">لغو شده</SelectItem></SelectContent></Select>{actionLoading === order.id && <Loader2 className="h-5 w-5 animate-spin" />}</div>
            </CardContent>
        </Card>
    );
    if (isLoading) return <div className="text-center pt-10"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>;
    if (orders.length === 0) return <div className="text-center pt-10 text-gray-500"><Package className="mx-auto h-12 w-12" /><p className="mt-4">هیچ سفارشی یافت نشد.</p></div>;
    return (<Tabs defaultValue="shipped" className="w-full"><TabsList className="grid w-full grid-cols-3"><TabsTrigger value="shipped">آماده تحویل ({ordersByStatus.shipped.length})</TabsTrigger><TabsTrigger value="delivered">تحویل شده ({ordersByStatus.delivered.length})</TabsTrigger><TabsTrigger value="others">سایر ({ordersByStatus.others.length})</TabsTrigger></TabsList><TabsContent value="shipped" className="pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{ordersByStatus.shipped.map(order => <OrderCard key={order.id} order={order} />)}</TabsContent><TabsContent value="delivered" className="pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{ordersByStatus.delivered.map(order => <OrderCard key={order.id} order={order} />)}</TabsContent><TabsContent value="others" className="pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{ordersByStatus.others.map(order => <OrderCard key={order.id} order={order} />)}</TabsContent></Tabs>);
}

// Returns Panel Component
function ReturnsPanel({returns, isLoading, refreshData}: {returns: ReturnForDelivery[], isLoading: boolean, refreshData: () => void}) {
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const handleStatusChange = async (returnId: string, status: ReturnStatus) => {
        setActionLoading(returnId);
        try {
            await apiClient.patch(`/returns/${returnId}/status`, { status });
            await refreshData();
        } catch (error) { alert((error as Error).message); }
        finally { setActionLoading(null); }
    };
    if (isLoading) return <div className="text-center pt-10"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>;
    if (returns.length === 0) return <div className="text-center pt-10 text-gray-500"><RefreshCw className="mx-auto h-12 w-12" /><p className="mt-4">هیچ درخواست مرجوعی یافت نشد.</p></div>;
    const ReturnCard = ({ ret }: { ret: ReturnForDelivery }) => (
        <Card><CardHeader><div className="flex justify-between items-start"><CardTitle className="text-base font-bold">{ret.order.user.shopName || ret.order.user.name}</CardTitle><Badge variant={getReturnStatusInfo(ret.status).variant}>{getReturnStatusInfo(ret.status).text}</Badge></div><CardDescription>شماره: ...{ret.id.slice(-6)} | تاریخ: {new Date(ret.createdAt).toLocaleDateString('fa-IR')}</CardDescription></CardHeader><CardContent><div className="text-sm space-y-2"><p className="font-semibold">اقلام مرجوعی:</p><ul className="list-disc list-inside bg-gray-50 p-2 rounded-md">{ret.items.map(item => <li key={item.id}>{item.orderItem.productName} (تعداد: {item.quantity})</li>)}</ul>{ret.reason && <p><span className="font-semibold">دلیل:</span> {ret.reason}</p>}</div><div className="flex items-center gap-2 mt-4"><Select onValueChange={(value) => handleStatusChange(ret.id, value as ReturnStatus)} defaultValue={ret.status} disabled={actionLoading === ret.id}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="REQUESTED">درخواست شده</SelectItem><SelectItem value="APPROVED">تایید شده</SelectItem><SelectItem value="REJECTED">رد شده</SelectItem></SelectContent></Select>{actionLoading === ret.id && <Loader2 className="h-5 w-5 animate-spin" />}</div></CardContent></Card>
    );
    return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{returns.map((ret: ReturnForDelivery) => <ReturnCard key={ret.id} ret={ret} />)}</div>;
}

// Main Page Component
export default function DeliveryManagementPage() {
    const [allOrders, setAllOrders] = useState<OrderWithRelations[]>([]);
    const [allReturns, setAllReturns] = useState<ReturnForDelivery[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [ordersRes, returnsRes] = await Promise.all([
                apiClient.get('/delivery-orders'), apiClient.get('/returns')
            ]);
            setAllOrders(ordersRes.data);
            setAllReturns(returnsRes.data);
        } catch (error) { console.error("Failed to fetch data for delivery management", error); }
        finally { setIsLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">مدیریت تحویل و مرجوعی</h1>
            <Tabs defaultValue="orders" className="w-full"><TabsList className="grid w-full grid-cols-2"><TabsTrigger value="orders">سفارشات</TabsTrigger><TabsTrigger value="returns">مرجوعی‌ها</TabsTrigger></TabsList>
                <TabsContent value="orders" className="pt-4"><OrdersPanel orders={allOrders} isLoading={isLoading} refreshData={fetchData} /></TabsContent>
                <TabsContent value="returns" className="pt-4"><ReturnsPanel returns={allReturns} isLoading={isLoading} refreshData={fetchData} /></TabsContent>
            </Tabs>
        </div>
    );
}
