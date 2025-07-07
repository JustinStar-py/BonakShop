// FILE: app/admin/dashboard/page.tsx (Final, Complete & Polished Version with All Features)
"use client";

import { useState, useEffect, useMemo, FormEvent } from "react";
import { DollarSign, ShoppingCart, Users, LogOut, Package, Send, LayoutDashboard, ListPlus, PlusCircle, Pencil, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useAppContext } from "@/context/AppContext";
import type { OrderWithItems } from "@/types";
import type { Category, Product } from "@prisma/client";

// --- Main Layout for the Admin Section ---
export default function AdminDashboardLayout() {
    const { user, setUser } = useAppContext();
    const [activePage, setActivePage] = useState("dashboard");
    const handleLogout = async () => { try { await fetch('/api/auth/logout', { method: 'POST' }); setUser(null); window.location.href = '/'; } catch (e) { console.error(e); } };

    if (!user || user.role !== 'ADMIN') return <div className="p-4 text-center">دسترسی غیر مجاز.</div>;

    const renderActivePage = () => {
        switch (activePage) {
            case 'products': return <ProductManagementPage />;
            case 'categories': return <CategoryManagementPage />;
            default: return <DashboardHomePage />;
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex" dir="rtl">
            <aside className="w-64 bg-card border-l p-4 flex flex-col justify-between">
                <div>
                    <h2 className="text-2xl font-bold mb-8 text-center text-card-foreground">پنل ادمین</h2>
                    <nav className="space-y-2">
                        <Button variant={activePage === 'dashboard' ? 'secondary' : 'ghost'} className="w-full justify-start gap-2" onClick={() => setActivePage('dashboard')}><LayoutDashboard /> داشبورد</Button>
                        <Button variant={activePage === 'products' ? 'secondary' : 'ghost'} className="w-full justify-start gap-2" onClick={() => setActivePage('products')}><Package /> مدیریت محصولات</Button>
                        <Button variant={activePage === 'categories' ? 'secondary' : 'ghost'} className="w-full justify-start gap-2" onClick={() => setActivePage('categories')}><ListPlus /> مدیریت دسته‌بندی‌ها</Button>
                    </nav>
                </div>
                <Button variant="ghost" onClick={handleLogout} className="w-full justify-start gap-2 text-destructive hover:text-destructive"><LogOut /> خروج</Button>
            </aside>
            <main className="flex-1 p-6 overflow-auto">{renderActivePage()}</main>
        </div>
    );
}

// --- Component for Dashboard Home ---
function DashboardHomePage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchAllOrders = async () => { setIsLoading(true); try { const res = await fetch('/api/admin/orders'); if (!res.ok) throw new Error("Unauthorized"); setOrders(await res.json()); } catch (e) { console.error(e) } finally { setIsLoading(false) } };
    useEffect(() => { fetchAllOrders(); }, []);

    const handleMarkAsShipped = async (orderId: string) => {
        setActionLoading(orderId);
        try {
            const res = await fetch(`/api/orders/${orderId}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'SHIPPED' }) });
            if (!res.ok) throw new Error("Failed to update status");
            await fetchAllOrders();
            new Notification("سفارش ارسال شد!", {body: `سفارش برای مشتری ارسال گردید.`});
        } catch (error) { console.error(error); alert("خطا در به‌روزرسانی وضعیت."); }
        finally { setActionLoading(null); }
    };

    const formatPrice = (p: number) => p.toLocaleString("fa-IR") + " ریال";
    const { kpiData, dailySalesData, customerStats } = useMemo(() => { if (!orders || orders.length === 0) return { kpiData: { totalRevenue: 0, totalOrders: 0, totalCustomers: 0 }, dailySalesData: [], customerStats: [] }; const totalRevenue = orders.reduce((s, o) => s + o.totalPrice, 0); const uniqueIds = new Set(orders.map(o => o.userId)); const salesByDay: any = {}; const last7 = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(new Date().getDate() - i); return d.toLocaleDateString('fa-IR', { weekday: 'short' }); }).reverse(); last7.forEach(d => salesByDay[d] = 0); orders.forEach(o => { const day = new Date(o.createdAt).toLocaleDateString('fa-IR', { weekday: 'short' }); if (salesByDay.hasOwnProperty(day)) salesByDay[day] += o.totalPrice; }); const finalSales = Object.keys(salesByDay).map(d => ({ name: d, "فروش": salesByDay[d] })); const custStats: any = {}; orders.forEach(o => { if (!custStats[o.userId]) custStats[o.userId] = { count: 0, total: 0, name: o.user?.shopName || o.user?.name || "مشتری" }; custStats[o.userId].count++; custStats[o.userId].total += o.totalPrice; }); return { kpiData: { totalRevenue, totalOrders: orders.length, totalCustomers: uniqueIds.size }, dailySalesData: finalSales, customerStats: Object.values(custStats).sort((a: any, b: any) => b.total - a.total).slice(0, 5) }; }, [orders]);
    
    if (isLoading) { return <p className="text-center py-10">در حال بارگذاری آمار...</p>; }
    
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-foreground">داشبورد اصلی</h1>
            {orders.length === 0 ? (<div className="text-center py-20 text-muted-foreground">هنوز هیچ سفارشی ثبت نشده است.</div>) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6"><Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">مجموع فروش</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatPrice(kpiData.totalRevenue)}</div></CardContent></Card><Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">تعداد کل سفارشات</CardTitle><ShoppingCart className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{kpiData.totalOrders.toLocaleString('fa-IR')}</div></CardContent></Card><Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">تعداد مشتریان</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{kpiData.totalCustomers.toLocaleString('fa-IR')}</div></CardContent></Card></div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"><Card className="lg:col-span-2"><CardHeader><CardTitle>گزارش فروش ۷ روز اخیر</CardTitle></CardHeader><CardContent className="h-80 w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={dailySalesData}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} /><YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `${(v / 1000000).toLocaleString('fa-IR')}م`} /><Tooltip wrapperClassName="!bg-popover !border-border" contentStyle={{ backgroundColor: 'hsl(var(--popover))' }} formatter={(v: number) => [formatPrice(v), "فروش"]} /><Legend /><Bar dataKey="فروش" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></CardContent></Card><Card><CardHeader><CardTitle>مشتریان برتر</CardTitle></CardHeader><CardContent><ul className="space-y-4">{customerStats.map((stat: any) => (<li key={stat.name} className="flex items-center justify-between"><div><p className="font-semibold">{stat.name}</p><p className="text-xs text-muted-foreground">{stat.count} سفارش</p></div><p className="font-mono text-primary">{formatPrice(stat.total)}</p></li>))}</ul></CardContent></Card></div>
                    <Card><CardHeader><CardTitle>سفارش‌های اخیر</CardTitle></CardHeader><CardContent><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead className="text-right">مشتری</TableHead><TableHead className="text-right">تاریخ</TableHead><TableHead className="text-right">مبلغ کل</TableHead><TableHead className="text-right">وضعیت</TableHead><TableHead className="text-right">عملیات</TableHead></TableRow></TableHeader><TableBody>{orders.slice(0, 5).map(order => (<TableRow key={order.id}><TableCell className="font-medium">{order.user.shopName || order.user.name}</TableCell><TableCell className="text-muted-foreground">{new Date(order.createdAt).toLocaleDateString('fa-IR')}</TableCell><TableCell>{formatPrice(order.totalPrice)}</TableCell><TableCell><Badge variant={order.status === "SHIPPED" ? "default" : "secondary"}>{order.status === 'PENDING' ? 'در حال بررسی' : 'ارسال شده'}</Badge></TableCell><TableCell>{order.status === "PENDING" ? <Button size="sm" onClick={() => handleMarkAsShipped(order.id)} disabled={actionLoading === order.id}>{actionLoading === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="w-3 h-3 ml-1" />تایید ارسال</>}</Button> : <span className="text-xs text-gray-500">-</span>}</TableCell></TableRow>))}</TableBody></Table></div></CardContent></Card>
                </>
            )}
        </div>
    );
}

// --- Component for Product Management with Discount Field in Edit Dialog ---
function ProductManagementPage() {
    const [products, setProducts] = useState<(Product & { category: Category })[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingProduct, setEditingProduct] = useState<(Product & { category: Category }) | null>(null);
    const [newProduct, setNewProduct] = useState({ name: "", price: "", description: "", categoryId: "", image: "", available: true, discountPercentage: "0" });
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchProductsAndCategories = async () => { setIsLoading(true); try { const [pRes, cRes] = await Promise.all([fetch('/api/products'), fetch('/api/categories')]); setProducts(await pRes.json()); setCategories(await cRes.json()); } catch (e) { console.error(e); } finally { setIsLoading(false); } };
    useEffect(() => { fetchProductsAndCategories(); }, []);

    const handleProductSubmit = async (e: FormEvent) => { e.preventDefault(); setActionLoading('new'); try { await fetch('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...newProduct, price: parseFloat(newProduct.price), discountPercentage: parseInt(newProduct.discountPercentage, 10) }) }); await fetchProductsAndCategories(); (document.getElementById('add-product-close') as HTMLButtonElement)?.click(); setNewProduct({ name: "", price: "", description: "", categoryId: "", image: "", available: true, discountPercentage: "0" }); } catch (e) { alert("خطا در افزودن محصول"); } finally { setActionLoading(null); } };
    const handleProductUpdate = async (e: FormEvent) => { e.preventDefault(); if (!editingProduct) return; setActionLoading(editingProduct.id); try { await fetch(`/api/products/${editingProduct.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...editingProduct, price: parseFloat(editingProduct.price as any), discountPercentage: parseInt(editingProduct.discountPercentage as any, 10) }) }); await fetchProductsAndCategories(); setEditingProduct(null); } catch (e) { console.error(e); alert("خطا در ویرایش محصول"); } finally { setActionLoading(null); } };
    
    if (isLoading) return <p className="text-center py-10">در حال بارگذاری...</p>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6"><h1 className="text-3xl font-bold">مدیریت محصولات</h1><Dialog><DialogTrigger asChild><Button><PlusCircle className="ml-2 h-4 w-4" />افزودن محصول</Button></DialogTrigger><DialogContent dir="rtl" className="sm:max-w-lg"><DialogHeader><DialogTitle>افزودن محصول جدید</DialogTitle></DialogHeader><form onSubmit={handleProductSubmit} className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                    <div><Label>نام</Label><Input value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} required/></div>
                    <div><Label>دسته‌بندی</Label><Select onValueChange={val => setNewProduct({...newProduct, categoryId: val})} required><SelectTrigger><SelectValue placeholder="انتخاب کنید" /></SelectTrigger><SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
                    <div><Label>قیمت (ریال)</Label><Input type="number" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} required/></div>
                    <div><Label>تخفیف (درصد)</Label><Input type="number" value={newProduct.discountPercentage} onChange={e => setNewProduct({...newProduct, discountPercentage: e.target.value})} required min="0" max="100"/></div>
                </div>
                <div><Label>آدرس عکس</Label><Input value={newProduct.image} onChange={e => setNewProduct({...newProduct, image: e.target.value})} /></div>
                <div><Label>توضیحات</Label><Textarea value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} /></div>
                <DialogFooter><DialogClose asChild id="add-product-close"><Button type="button" variant="secondary">انصراف</Button></DialogClose><Button type="submit" disabled={actionLoading === 'new'}>{actionLoading === 'new' ? <Loader2 className="animate-spin" /> : "ذخیره"}</Button></DialogFooter></form></DialogContent></Dialog></div>
            <Card><CardContent className="mt-6"><Table><TableHeader><TableRow>
                <TableHead className="text-right">عکس</TableHead>
                <TableHead className="text-right">نام</TableHead>
                <TableHead className="text-right">قیمت</TableHead>
                <TableHead className="text-right">تخفیف</TableHead>
                <TableHead className="text-right">وضعیت</TableHead>
                <TableHead className="text-center">عملیات</TableHead>
            </TableRow></TableHeader><TableBody>{products.map(p => (<TableRow key={p.id}>
                <TableCell className="text-right"><img src={p.image || "/placeholder.svg"} alt={p.name} className="h-12 w-12 rounded-md object-cover" /></TableCell>
                <TableCell className="text-right font-medium">{p.name}</TableCell>
                <TableCell className="text-right">{p.price.toLocaleString('fa-IR')} ریال</TableCell>
                <TableCell className="text-right">{p.discountPercentage > 0 ? `${p.discountPercentage}%` : '-'}</TableCell>
                <TableCell className="text-right"><Badge variant={p.available ? 'default' : 'destructive'}>{p.available ? "موجود" : "ناموجود"}</Badge></TableCell>
                <TableCell className="text-center"><Button size="sm" variant="outline" onClick={() => setEditingProduct(p)}><Pencil className="h-4 w-4" /></Button></TableCell>
            </TableRow>))}</TableBody></Table></CardContent></Card>
            
            <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}><DialogContent dir="rtl" className="sm:max-w-lg"><DialogHeader><DialogTitle>ویرایش محصول: {editingProduct?.name}</DialogTitle></DialogHeader>{editingProduct && (<form onSubmit={handleProductUpdate} className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                    <div><Label>نام محصول</Label><Input value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} required/></div>
                     <div><Label>دسته‌بندی</Label><Select value={editingProduct.categoryId} onValueChange={val => setEditingProduct({...editingProduct, categoryId: val})} required><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
                    <div><Label>قیمت (ریال)</Label><Input type="number" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value) || 0})} required/></div>
                    <div><Label>تخفیف (درصد)</Label><Input type="number" value={editingProduct.discountPercentage} onChange={e => setEditingProduct({...editingProduct, discountPercentage: parseInt(e.target.value) || 0})} required min="0" max="100"/></div>
                </div>
                <div><Label>آدرس URL عکس</Label><Input value={editingProduct.image || ""} onChange={e => setEditingProduct({...editingProduct, image: e.target.value})} /></div><div><Label>توضیحات</Label><Textarea value={editingProduct.description || ""} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} /></div>
                <div className="flex items-center space-x-2"><Switch id="availability" checked={editingProduct.available} onCheckedChange={(checked) => setEditingProduct({...editingProduct, available: checked})} /><Label htmlFor="availability">موجود است</Label></div>
                <DialogFooter><Button type="button" variant="secondary" onClick={() => setEditingProduct(null)}>انصراف</Button><Button type="submit" disabled={actionLoading === editingProduct.id}>{actionLoading === editingProduct.id ? <Loader2 className="animate-spin" /> : "ذخیره تغییرات"}</Button></DialogFooter></form>)}</DialogContent></Dialog>
        </div>
    );
}

// --- Component for Category Management ---
function CategoryManagementPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newCategory, setNewCategory] = useState({ name: "", icon: "" });
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchCategories = async () => { setIsLoading(true); try { const res = await fetch('/api/categories'); setCategories(await res.json()); } catch(e) { console.error(e); } finally { setIsLoading(false); } };
    useEffect(() => { fetchCategories(); }, []);

    const handleCategorySubmit = async (e: FormEvent) => { e.preventDefault(); setActionLoading('new'); try { await fetch('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newCategory) }); await fetchCategories(); setNewCategory({ name: "", icon: "" }); (document.getElementById('add-category-close') as HTMLButtonElement)?.click(); } catch (e) { alert("خطا"); } finally { setActionLoading(null); } };
    const handleCategoryUpdate = async (e: FormEvent) => { e.preventDefault(); if (!editingCategory) return; setActionLoading(editingCategory.id); try { await fetch(`/api/categories/${editingCategory.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editingCategory) }); await fetchCategories(); setEditingCategory(null); } catch (e) { alert("خطا در ویرایش"); } finally { setActionLoading(null); } };

    if (isLoading) return <p className="text-center py-10">در حال بارگذاری...</p>;
    
    return (
        <div>
            <div className="flex justify-between items-center mb-6"><h1 className="text-3xl font-bold">مدیریت دسته‌بندی‌ها</h1><Dialog><DialogTrigger asChild><Button><PlusCircle className="ml-2 h-4 w-4" />افزودن دسته‌بندی</Button></DialogTrigger><DialogContent dir="rtl"><DialogHeader><DialogTitle>افزودن دسته‌بندی جدید</DialogTitle></DialogHeader><form onSubmit={handleCategorySubmit} className="space-y-4 pt-4"><div><Label>نام دسته‌بندی</Label><Input value={newCategory.name} onChange={e => setNewCategory({...newCategory, name: e.target.value})} required/></div><div><Label>آیکون (Emoji)</Label><Input value={newCategory.icon} onChange={e => setNewCategory({...newCategory, icon: e.target.value})} placeholder="مثلاً: 🌭"/></div><DialogFooter><DialogClose asChild id="add-category-close"><Button type="button" variant="secondary">انصراف</Button></DialogClose><Button type="submit" disabled={actionLoading === 'new'}>{actionLoading === 'new' ? <Loader2 className="animate-spin" /> : "ذخیره"}</Button></DialogFooter></form></DialogContent></Dialog></div>
            {categories.length > 0 ? (
                <Card><CardContent className="mt-6"><Table><TableHeader><TableRow><TableHead className="text-right">آیکون</TableHead><TableHead className="text-right">نام</TableHead><TableHead className="text-right">عملیات</TableHead></TableRow></TableHeader><TableBody>{categories.map(c => <TableRow key={c.id}><TableCell className="text-2xl text-right">{c.icon}</TableCell><TableCell className="text-right font-medium">{c.name}</TableCell><TableCell className="text-right"><Button size="sm" variant="outline" onClick={() => setEditingCategory(c)}><Pencil className="h-4 w-4" /></Button></TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
            ) : ( <p className="text-center py-10 text-muted-foreground">هنوز دسته‌بندی‌ای اضافه نشده است.</p> )}
            
            <Dialog open={!!editingCategory} onOpenChange={() => setEditingCategory(null)}><DialogContent dir="rtl"><DialogHeader><DialogTitle>ویرایش دسته‌بندی: {editingCategory?.name}</DialogTitle></DialogHeader>{editingCategory && (<form onSubmit={handleCategoryUpdate} className="space-y-4 pt-4"><div><Label>نام دسته‌بندی</Label><Input value={editingCategory.name} onChange={e => setEditingCategory({...editingCategory, name: e.target.value})} required/></div><div><Label>آیکون (Emoji)</Label><Input value={editingCategory.icon || ""} onChange={e => setEditingCategory({...editingCategory, icon: e.target.value})} /></div><DialogFooter><Button type="button" variant="secondary" onClick={() => setEditingCategory(null)}>انصراف</Button><Button type="submit" disabled={actionLoading === editingCategory.id}>{actionLoading === editingCategory.id ? <Loader2 className="animate-spin" /> : "ذخیره تغییرات"}</Button></DialogFooter></form>)}</DialogContent></Dialog>
        </div>
    );
}