"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, DollarSign, ShoppingBag, Users, TrendingUp, ArrowUpRight, AlertCircle } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, AreaChart, Area } from "recharts";
import apiClient from "@/lib/apiClient";
import { formatToToman } from "@/utils/currencyFormatter";
import { cn } from "@/lib/utils";
import { useAppContext } from "@/context/AppContext";
import TomanPrice from "@/components/shared/TomanPrice";

// Helper function to format currency
function formatPriceLabel(price: number) {
    const formatted = formatToToman(price);
    return formatted || "۰ تومان";
}

// KPI Card Component for reusability
function KpiCard({ title, value, icon: Icon, className, trend }: any) {
    return (
        <Card className={cn("overflow-hidden transition-all hover:shadow-md border-slate-200", className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Icon size={16} />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-slate-900">{value}</div>
                {trend && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <span className="text-emerald-600 flex items-center">
                            <ArrowUpRight size={12} /> 
                            {trend}
                        </span>
                        <span className="opacity-70">نسبت به ماه گذشته</span>
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

export default function DashboardHomePage() {
    const { isLoadingUser } = useAppContext();
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDashboardData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await apiClient.get('/admin/dashboard');
            setStats(res.data);
        } catch (e) {
            console.error("Failed to fetch dashboard data", e);
            setError("خطا در دریافت اطلاعات داشبورد.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!isLoadingUser) {
            fetchDashboardData();
        }
    }, [isLoadingUser]);

    if (isLoadingUser || isLoading) {
        return (
            <div className="flex justify-center items-center h-96">
                <div className="flex flex-col items-center gap-4 text-slate-400">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-sm">در حال بارگذاری اطلاعات...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col justify-center items-center h-96 gap-4 text-red-600">
                <AlertCircle className="h-12 w-12" />
                <p className="text-lg font-medium">{error}</p>
                <Button onClick={fetchDashboardData} variant="outline">
                    تلاش مجدد
                </Button>
            </div>
        );
    }

    if (!stats) return null;

    return (
        <div className="space-y-6">
            {/* KPI Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KpiCard 
                    title="مجموع فروش کل" 
                    value={<TomanPrice value={stats.kpiData?.totalRevenue || 0} />} 
                    icon={DollarSign}
                />
                <KpiCard 
                    title="تعداد کل سفارشات" 
                    value={(stats.kpiData?.totalOrders || 0).toLocaleString('fa-IR')} 
                    icon={ShoppingBag}
                />
                <KpiCard 
                    title="تعداد مشتریان" 
                    value={(stats.kpiData?.totalCustomers || 0).toLocaleString('fa-IR')} 
                    icon={Users}
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sales Chart */}
                <Card className="lg:col-span-2 border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
                            <TrendingUp size={20} className="text-primary" />
                            نمودار فروش ۷ روز اخیر
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[350px] w-full pl-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.dailySalesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis 
                                    dataKey="name" 
                                    fontSize={12} 
                                    tickLine={false} 
                                    axisLine={false} 
                                    tickMargin={10}
                                    stroke="#64748b"
                                />
                                <YAxis 
                                    fontSize={11} 
                                    tickFormatter={(v) => `${(v / 1000000).toLocaleString('fa-IR')}م`} 
                                    tickLine={false}
                                    axisLine={false}
                                    stroke="#64748b"
                                />
                                <Tooltip 
                                    cursor={{ fill: '#f1f5f9' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    formatter={(v: number) => [formatPriceLabel(v), "فروش"]} 
                                />
                                <Bar 
                                    dataKey="فروش" 
                                    fill="hsl(var(--primary))" 
                                    radius={[6, 6, 0, 0]} 
                                    barSize={40}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Top Customers List */}
                <Card className="border-slate-200 shadow-sm flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-lg text-slate-800">مشتریان برتر</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-auto">
                        <ul className="space-y-5">
                            {stats.customerStats?.map((stat: any, index: number) => (
                                <li key={index} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs group-hover:bg-primary group-hover:text-white transition-colors">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm text-slate-900">{stat.name}</p>
                                            <p className="text-xs text-slate-500">{stat.count.toLocaleString('fa-IR')} سفارش ثبت شده</p>
                                        </div>
                                    </div>
                                    <div className="text-sm font-bold bg-primary/5 px-2 py-1 rounded-md">
                                        <TomanPrice value={stat.total} />
                                    </div>
                                </li>
                            ))}
                            {(!stats.customerStats || stats.customerStats.length === 0) && (
                                <div className="text-center text-muted-foreground text-sm py-8">
                                    هنوز داده‌ای موجود نیست
                                </div>
                            )}
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
