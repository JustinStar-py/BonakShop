// FILE: app/admin/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import apiClient from "@/lib/apiClient";
import { formatToToman } from "@/utils/toman";

// Helper function to format currency
function formatPrice(price: number) {
    const formatted = formatToToman(price);
    return formatted || "۰ تومان";
}

export default function DashboardHomePage() {
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setIsLoading(true);
            try {
                const res = await apiClient.get('/admin/dashboard');
                setStats(res.data);
            } catch (e) {
                console.error("Failed to fetch dashboard data", e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    if (isLoading || !stats) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-foreground">داشبورد اصلی</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card><CardHeader><CardTitle className="text-sm font-medium">مجموع فروش</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{formatPrice(stats.kpiData?.totalRevenue || 0)}</div></CardContent></Card>
                <Card><CardHeader><CardTitle className="text-sm font-medium">تعداد کل سفارشات</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{(stats.kpiData?.totalOrders || 0).toLocaleString('fa-IR')}</div></CardContent></Card>
                <Card><CardHeader><CardTitle className="text-sm font-medium">تعداد مشتریان</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{(stats.kpiData?.totalCustomers || 0).toLocaleString('fa-IR')}</div></CardContent></Card>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader><CardTitle>گزارش فروش ۷ روز اخیر</CardTitle></CardHeader>
                    <CardContent className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%"><BarChart data={stats.dailySalesData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" fontSize={12} /><YAxis fontSize={12} tickFormatter={(v) => `${(v / 1000000).toLocaleString('fa-IR')}م`} /><Tooltip formatter={(v: number) => [formatPrice(v), "فروش"]} /><Legend /><Bar dataKey="فروش" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>مشتریان برتر</CardTitle></CardHeader>
                    <CardContent>
                        <ul className="space-y-4">{stats.customerStats?.map((stat: any, index: number) => (<li key={index} className="flex items-center justify-between"><div><p className="font-semibold">{stat.name}</p><p className="text-xs text-muted-foreground">{stat.count} سفارش</p></div><p className="font-mono text-primary">{formatPrice(stat.total)}</p></li>))}</ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
