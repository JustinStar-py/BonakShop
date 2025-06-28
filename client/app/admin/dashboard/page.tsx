// FILE: app/admin/dashboard/page.tsx (The final, complete, and theme-aware version)
"use client";

import { useState, useEffect, useMemo } from "react";
import { DollarSign, ShoppingCart, Users, LogOut, Package, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useAppContext } from "@/context/AppContext";

// --- Main Admin Dashboard Page Component ---
export default function AdminDashboardPage() {
    const { user, setUser } = useAppContext();
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchAllOrders = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/admin/orders');
            if (!res.ok) throw new Error("Failed to fetch orders or not authorized.");
            const data = await res.json();
            setOrders(data);
        } catch (error) {
            console.error(error);
            alert((error as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user && user.role !== 'ADMIN') {
            window.location.href = '/'; // Redirect non-admins
        }
        if (user) { // Only fetch if user is determined
            fetchAllOrders();
        }
    }, [user]);

    const handleMarkAsShipped = async (orderId: string) => {
        try {
            const res = await fetch(`/api/orders/${orderId}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'SHIPPED' }) });
            if (!res.ok) throw new Error("Failed to update status");
            await fetchAllOrders(); // Refresh list after update
            new Notification("سفارش ارسال شد!", { body: "سفارش برای مشتری ارسال گردید." });
        } catch (error) { console.error(error); alert("خطا در به‌روزرسانی وضعیت."); }
    };

    const handleLogout = async () => { try { await fetch('/api/auth/logout', { method: 'POST' }); setUser(null); window.location.href = '/'; } catch (e) { console.error(e); } };
    const formatPrice = (p: number) => p.toLocaleString("fa-IR") + " ریال";

    // --- Data Processing for Charts and KPIs (Memoized for performance) ---
    const { kpiData, dailySalesData, customerStats } = useMemo(() => {
        if (!orders || orders.length === 0) {
            return { kpiData: { totalRevenue: 0, totalOrders: 0, totalCustomers: 0 }, dailySalesData: [], customerStats: [] };
        }
        const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);
        const uniqueCustomerIds = new Set(orders.map(order => order.userId));
        
        const salesByDay: { [key: string]: number } = {};
        const today = new Date();
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(today.getDate() - i);
            return d.toLocaleDateString('fa-IR', { weekday: 'short' });
        }).reverse();

        last7Days.forEach(day => salesByDay[day] = 0);

        orders.forEach(order => {
            const orderDay = new Date(order.createdAt).toLocaleDateString('fa-IR', { weekday: 'short' });
            if (salesByDay.hasOwnProperty(orderDay)) {
                salesByDay[orderDay] += order.totalPrice;
            }
        });

        const finalDailySales = Object.keys(salesByDay).map(day => ({ name: day, "فروش": salesByDay[day] }));
        
        const custStats: { [key: string]: { count: number; total: number; name: string } } = {};
        orders.forEach(order => {
            if (!custStats[order.userId]) custStats[order.userId] = { count: 0, total: 0, name: order.user?.shopName || order.user?.name || "مشتری" };
            custStats[order.userId].count++;
            custStats[order.userId].total += order.totalPrice;
        });

        return {
            kpiData: { totalRevenue, totalOrders: orders.length, totalCustomers: uniqueCustomerIds.size },
            dailySalesData: finalDailySales,
            customerStats: Object.values(custStats).sort((a,b) => b.total - a.total).slice(0, 5)
        };
    }, [orders]);

    if (isLoading) { return <div className="flex items-center justify-center min-h-screen bg-background text-foreground"><p>در حال بارگذاری داشبورد...</p></div>; }
    if (!user || user.role !== 'ADMIN') { return <div className="p-4 text-center text-foreground">دسترسی غیر مجاز. لطفاً با حساب ادمین وارد شوید.</div>; }

    return (
        <div className="min-h-screen bg-background text-foreground" dir="rtl">
            <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <h1 className="text-2xl md:text-3xl font-bold text-card-foreground">داشبورد مدیریت</h1>
                    <Button variant="ghost" onClick={handleLogout} className="text-destructive-foreground"><LogOut className="ml-2 h-4 w-4" />خروج</Button>
                </div>
            </header>

            <main className="container mx-auto px-4 py-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">مجموع فروش</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-card-foreground">{formatPrice(kpiData.totalRevenue)}</div></CardContent></Card>
                    <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">تعداد کل سفارشات</CardTitle><ShoppingCart className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-card-foreground">{kpiData.totalOrders.toLocaleString('fa-IR')}</div></CardContent></Card>
                    <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">تعداد مشتریان</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-card-foreground">{kpiData.totalCustomers.toLocaleString('fa-IR')}</div></CardContent></Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-2"><CardHeader><CardTitle className="text-card-foreground">گزارش فروش ۷ روز اخیر</CardTitle></CardHeader><CardContent className="h-80 w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={dailySalesData}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} /><YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(value) => `${(value / 1000000).toLocaleString('fa-IR')}م`} /><Tooltip wrapperClassName="!bg-popover !border-border" contentStyle={{ backgroundColor: 'hsl(var(--popover))', color: 'hsl(var(--popover-foreground))' }} formatter={(value: number) => [formatPrice(value), "فروش"]} /><Legend /><Bar dataKey="فروش" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></CardContent></Card>
                    <Card><CardHeader><CardTitle className="text-card-foreground">مشتریان برتر</CardTitle></CardHeader><CardContent><ul className="space-y-4">{customerStats.map(stat => (<li key={stat.name} className="flex items-center justify-between"><div><p className="font-semibold text-card-foreground">{stat.name}</p><p className="text-xs text-muted-foreground">{stat.count} سفارش</p></div><p className="font-mono text-primary">{formatPrice(stat.total)}</p></li>))}</ul></CardContent></Card>
                </div>

                <Card><CardHeader><CardTitle className="text-card-foreground">سفارش‌های اخیر</CardTitle></CardHeader><CardContent><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>شماره</TableHead><TableHead>مشتری</TableHead><TableHead>تاریخ</TableHead><TableHead>مبلغ</TableHead><TableHead>وضعیت</TableHead><TableHead>عملیات</TableHead></TableRow></TableHeader><TableBody>{orders.slice(0, 5).map(order => (<TableRow key={order.id}><TableCell className="font-medium">...{order.id.substring(18)}</TableCell><TableCell>{order.user.shopName || order.user.name}</TableCell><TableCell className="text-muted-foreground">{new Date(order.createdAt).toLocaleDateString('fa-IR')}</TableCell><TableCell>{formatPrice(order.totalPrice)}</TableCell><TableCell><Badge variant={order.status === "SHIPPED" ? "default" : "secondary"}>{order.status === 'PENDING' ? 'در حال بررسی' : 'ارسال شده'}</Badge></TableCell><TableCell>{order.status === "PENDING" ? <Button size="sm" onClick={() => handleMarkAsShipped(order.id)}><Send className="w-3 h-3 ml-1" />ارسال شد</Button> : <span className="text-xs text-muted-foreground">-</span>}</TableCell></TableRow>))}</TableBody></Table></div></CardContent></Card>
            </main>
        </div>
    );
}