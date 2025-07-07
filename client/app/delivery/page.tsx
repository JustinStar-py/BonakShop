// FILE: app/delivery/page.tsx
// FINAL VERSION: Redesigned UI with Tabs, detailed order cards, and map view.
"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from 'next/dynamic';
import { useRouter } from "next/navigation";
import { Truck, CheckCircle, Loader2, LogOut, FileText, ArrowRight, MapPin, Phone, Building, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppContext } from "@/context/AppContext";
import type { Order, User, OrderItem, OrderStatus } from "@prisma/client";
import { LatLngTuple } from "leaflet";

type OrderForDelivery = Order & {
  user: { name: string | null; shopName: string | null; shopAddress: string | null; phone: string; latitude: number | null; longitude: number | null; };
  items: OrderItem[];
};

const MapPicker = dynamic(() => import('@/components/shared/MapPicker'), {
    ssr: false,
    loading: () => <div className="h-64 w-full bg-gray-200 animate-pulse rounded-md flex items-center justify-center"><p>در حال بارگذاری نقشه...</p></div>
});

export default function DeliveryPage() {
    const { user, setUser, isLoadingUser } = useAppContext();
    const router = useRouter();
    const [allOrders, setAllOrders] = useState<OrderForDelivery[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchAllOrders = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/delivery-orders');
            if (res.ok) setAllOrders(await res.json());
            else handleLogout();
        } catch (error) { console.error("Failed to fetch orders", error);
        } finally { setIsLoading(false); }
    };
    
    useEffect(() => {
        if (!isLoadingUser && (!user || (user.role !== 'WORKER' && user.role !== 'ADMIN'))) router.replace('/');
        if(user && (user.role === 'WORKER' || user.role === 'ADMIN')) fetchAllOrders();
    }, [user, isLoadingUser, router]);

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            setUser(null);
            router.push('/');
        } catch(e) { console.error(e) }
    };
    
    const handleStatusChange = async (orderId: string, status: OrderStatus) => {
        setActionLoading(orderId);
        try {
            const res = await fetch(`/api/orders/${orderId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "خطا در به‌روزرسانی وضعیت");
            }
            await fetchAllOrders(); 
        } catch (error) {
            alert((error as Error).message);
        } finally {
            setActionLoading(null);
        }
    };
    
    const formatPrice = (p: number) => p.toLocaleString("fa-IR", { useGrouping: false }) + " ریال";
    const getStatusInfo = (status: OrderStatus): { text: string; variant: "default" | "secondary" | "destructive" } => {
        const map = { 
            PENDING: { text: "در حال بررسی", variant: "secondary" as "secondary" }, 
            SHIPPED: { text: "ارسال شده", variant: "default" as "default" }, 
            DELIVERED: { text: "تحویل داده شد", variant: "default" as "default" }, 
            CANCELED: { text: "لغو شده", variant: "destructive" as "destructive" } 
        };
        return map[status];
    }

    const ordersByStatus = useMemo(() => {
        const shipped = allOrders.filter(o => o.status === 'SHIPPED');
        const delivered = allOrders.filter(o => o.status === 'DELIVERED');
        const others = allOrders.filter(o => o.status !== 'SHIPPED' && o.status !== 'DELIVERED');
        return { shipped, delivered, others };
    }, [allOrders]);

    if (isLoadingUser || !user) {
        return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    const OrderCard = ({ order }: { order: OrderForDelivery }) => (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle className="text-base font-bold">{order.user.shopName || order.user.name}</CardTitle>
                    <Badge variant={getStatusInfo(order.status).variant}>{getStatusInfo(order.status).text}</Badge>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground pt-2">
                    <p className="flex items-center gap-2"><UserIcon className="h-4 w-4" />{order.user.name}</p>
                    <p className="flex items-center gap-2"><Building className="h-4 w-4" />{order.user.shopAddress}</p>
                    <p className="flex items-center gap-2"><Phone className="h-4 w-4" />{order.user.phone}</p>
                </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
                <div className="flex gap-2">
                    <Dialog>
                        <DialogTrigger asChild><Button variant="outline" className="w-full"><FileText className="ml-2 h-4 w-4"/>فاکتور</Button></DialogTrigger>
                        <DialogContent className="max-w-sm">
                            <CardHeader><CardTitle>فاکتور سفارش</CardTitle><CardDescription>شماره: ...{order.id.slice(-6)}</CardDescription></CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                {order.items.map(item => (<div key={item.id} className="flex justify-between"><span>{item.productName} (×{item.quantity})</span><span>{formatPrice(item.price * item.quantity)}</span></div>))}
                                <Separator />
                                <div className="flex justify-between font-bold"><span>مبلغ کل:</span><span>{formatPrice(order.totalPrice)}</span></div>
                            </CardContent>
                        </DialogContent>
                    </Dialog>
                    {order.user.latitude && order.user.longitude &&
                        <Dialog>
                            <DialogTrigger asChild><Button variant="outline" className="w-full"><MapPin className="ml-2 h-4 w-4"/>نقشه</Button></DialogTrigger>
                            <DialogContent><MapPicker readOnly marker={{ position: [order.user.latitude, order.user.longitude], popupText: order.user.shopName || 'موقعیت'}}/></DialogContent>
                        </Dialog>
                    }
                </div>
                <div className="flex items-center gap-2">
                    <Select onValueChange={(value) => handleStatusChange(order.id, value as OrderStatus)} defaultValue={order.status} disabled={actionLoading === order.id}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="تغییر وضعیت..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="PENDING">در حال بررسی</SelectItem>
                            <SelectItem value="SHIPPED">ارسال شده</SelectItem>
                            <SelectItem value="DELIVERED">تحویل داده شد</SelectItem>
                            <SelectItem value="CANCELED">لغو شده</SelectItem>
                        </SelectContent>
                    </Select>
                    {actionLoading === order.id && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="min-h-screen bg-gray-100 font-sans" dir="rtl">
             <header className="sticky top-0 bg-white z-10 p-4 border-b flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold">پنل مدیریت سفارشات</h1>
                    <p className="text-sm text-muted-foreground">سلام، {user.name}</p>
                </div>
                <div>
                    {user.role === 'ADMIN' && (<Button variant="ghost" onClick={() => router.push('/admin/dashboard')} className="ml-2"><ArrowRight className="ml-2 h-4 w-4" />داشبورد</Button>)}
                    <Button variant="ghost" size="icon" onClick={handleLogout} className="text-red-500"><LogOut className="h-5 w-5" /></Button>
                </div>
            </header>
            <main className="p-4 space-y-4">
                {isLoading ? ( <div className="text-center pt-20"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" /></div> ) : 
                allOrders.length === 0 ? ( <div className="text-center pt-20 text-gray-500"><Truck className="mx-auto h-16 w-16" /><p className="mt-4">هیچ سفارشی برای نمایش وجود ندارد.</p></div> ) : 
                (
                    <Tabs defaultValue="shipped" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="shipped">آماده تحویل ({ordersByStatus.shipped.length})</TabsTrigger>
                            <TabsTrigger value="delivered">تحویل شده ({ordersByStatus.delivered.length})</TabsTrigger>
                            <TabsTrigger value="others">سایر سفارشات ({ordersByStatus.others.length})</TabsTrigger>
                        </TabsList>
                        <TabsContent value="shipped" className="pt-4 space-y-4">{ordersByStatus.shipped.map(order => <OrderCard key={order.id} order={order} />)}</TabsContent>
                        <TabsContent value="delivered" className="pt-4 space-y-4">{ordersByStatus.delivered.map(order => <OrderCard key={order.id} order={order} />)}</TabsContent>
                        <TabsContent value="others" className="pt-4 space-y-4">{ordersByStatus.others.map(order => <OrderCard key={order.id} order={order} />)}</TabsContent>
                    </Tabs>
                )}
            </main>
        </div>
    );
}