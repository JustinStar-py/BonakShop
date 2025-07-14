"use client";

import { useState, useEffect, useMemo, FormEvent } from "react";
import { DollarSign, ShoppingCart, Users, LogOut, Package, ListPlus, PlusCircle, Pencil, Loader2, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useAppContext } from "@/context/AppContext";
import type { Category, Product, Order, User } from "@prisma/client";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

// --- Helper function ---
function formatPrice(price: number) {
    return price.toLocaleString('fa-IR') + " ریال";
}

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
                        <Button variant={activePage === 'dashboard' ? 'secondary' : 'ghost'} className="w-full justify-start gap-2" onClick={() => setActivePage('dashboard')}><DollarSign /> داشبورد</Button>
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
    const [orders, setOrders] = useState<Order[]>([]);
    const [kpiData, setKpiData] = useState({ totalRevenue: 0, totalOrders: 0, totalCustomers: 0 });
    const [customerStats, setCustomerStats] = useState<{ name: string, count: number, total: number }[]>([]);
    const [dailySalesData, setDailySalesData] = useState<any[]>([]);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        // Fetch dashboard data from API
        const fetchDashboardData = async () => {
            try {
                // فرض بر این است که API زیر وجود دارد و داده‌های مورد نیاز را برمی‌گرداند
                const res = await fetch('/api/admin/dashboard');
                const data = await res.json();
                setOrders(data.orders || []);
                setKpiData(data.kpiData || { totalRevenue: 0, totalOrders: 0, totalCustomers: 0 });
                setCustomerStats(data.customerStats || []);
                setDailySalesData(data.dailySalesData || []);
            } catch (e) {
                setOrders([]);
                setKpiData({ totalRevenue: 0, totalOrders: 0, totalCustomers: 0 });
                setCustomerStats([]);
                setDailySalesData([]);
            }
        };
        fetchDashboardData();
    }, []);

    // تایید ارسال سفارش
    const handleMarkAsShipped = async (orderId: string) => {
        setActionLoading(orderId);
        try {
            await fetch(`/api/orders/${orderId}/ship`, { method: "POST" });
            // بعد از تایید ارسال، داده‌ها را مجدد دریافت کن
            const res = await fetch('/api/admin/dashboard');
            const data = await res.json();
            setOrders(data.orders || []);
        } catch (e) {
            alert("خطا در تایید ارسال سفارش");
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-foreground">داشبورد اصلی</h1>
            {orders.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">هنوز هیچ سفارشی ثبت نشده است.</div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">مجموع فروش</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatPrice(kpiData.totalRevenue)}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">تعداد کل سفارشات</CardTitle>
                                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{kpiData.totalOrders.toLocaleString('fa-IR')}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">تعداد مشتریان</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{kpiData.totalCustomers.toLocaleString('fa-IR')}</div>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle>گزارش فروش ۷ روز اخیر</CardTitle>
                            </CardHeader>
                            <CardContent className="h-80 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={dailySalesData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `${(v / 1000000).toLocaleString('fa-IR')}م`} />
                                        <Tooltip wrapperClassName="!bg-popover !border-border" contentStyle={{ backgroundColor: 'hsl(var(--popover))' }} formatter={(v: number) => [formatPrice(v), "فروش"]} />
                                        <Legend />
                                        <Bar dataKey="فروش" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>مشتریان برتر</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-4">
                                    {customerStats.map((stat: any) => (
                                        <li key={stat.name} className="flex items-center justify-between">
                                            <div>
                                                <p className="font-semibold">{stat.name}</p>
                                                <p className="text-xs text-muted-foreground">{stat.count} سفارش</p>
                                            </div>
                                            <p className="font-mono text-primary">{formatPrice(stat.total)}</p>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                    <Card>
                        <CardHeader>
                            <CardTitle>سفارش‌های اخیر</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="text-right">مشتری</TableHead>
                                            <TableHead className="text-right">تاریخ</TableHead>
                                            <TableHead className="text-right">مبلغ کل</TableHead>
                                            <TableHead className="text-right">وضعیت</TableHead>
                                            <TableHead className="text-right">عملیات</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {orders.slice(0, 5).map(order => (
                                            <TableRow key={order.id}>
                                                <TableCell className="font-medium">{order.user?.shopName || order.user?.name || "بدون نام"}</TableCell>
                                                <TableCell className="text-muted-foreground">{new Date(order.createdAt).toLocaleDateString('fa-IR')}</TableCell>
                                                <TableCell>{formatPrice(order.totalPrice)}</TableCell>
                                                <TableCell>
                                                    <Badge variant={order.status === "SHIPPED" ? "default" : "secondary"}>
                                                        {order.status === 'PENDING' ? 'در حال بررسی' : 'ارسال شده'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {order.status === "PENDING" ? (
                                                        <Button size="sm" onClick={() => handleMarkAsShipped(order.id)} disabled={actionLoading === order.id}>
                                                            {actionLoading === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="w-3 h-3 ml-1" />تایید ارسال</>}
                                                        </Button>
                                                    ) : (
                                                        <span className="text-xs text-gray-500">-</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}

// --- Product Management ---
function ProductManagementPage() {
    const [products, setProducts] = useState<(Product & { category: Category })[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingProduct, setEditingProduct] = useState<(Product & { category: Category }) | null>(null);
    const [newProduct, setNewProduct] = useState({ name: "", price: "", description: "", categoryId: "", image: "", available: true, discountPercentage: "0", unit: "عدد", stock: 0 });
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchProductsAndCategories = async () => {
        setIsLoading(true);
        try {
            const [pRes, cRes] = await Promise.all([fetch('/api/products'), fetch('/api/categories')]);
            setProducts(await pRes.json());
            setCategories(await cRes.json());
        } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };
    useEffect(() => { fetchProductsAndCategories(); }, []);

    const handleProductSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setActionLoading('new');
        try {
            await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...newProduct, price: parseFloat(newProduct.price), discountPercentage: parseInt(newProduct.discountPercentage, 10) })
            });
            await fetchProductsAndCategories();
            (document.getElementById('add-product-close') as HTMLButtonElement)?.click();
            setNewProduct({ name: "", price: "", description: "", categoryId: "", image: "", available: true, discountPercentage: "0", unit: "عدد", stock: 0 });
        } catch (e) { alert("خطا در افزودن محصول"); } finally { setActionLoading(null); }
    };

    const handleProductUpdate = async (e: FormEvent) => {
        e.preventDefault();
        if (!editingProduct) return;
        setActionLoading(editingProduct.id);
        try {
            await fetch(`/api/products/${editingProduct.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...editingProduct, price: parseFloat(editingProduct.price as any), discountPercentage: parseInt(editingProduct.discountPercentage as any, 10) })
            });
            await fetchProductsAndCategories();
            setEditingProduct(null);
        } catch (e) { alert("خطا در ویرایش محصول"); } finally { setActionLoading(null); }
    };

    if (isLoading) return <p className="text-center py-10">در حال بارگذاری...</p>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">مدیریت محصولات</h1>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button><PlusCircle className="ml-2 h-4 w-4" />افزودن محصول</Button>
                    </DialogTrigger>
                    <DialogContent dir="rtl" className="sm:max-w-lg">
                        <DialogHeader><DialogTitle>افزودن محصول جدید</DialogTitle></DialogHeader>
                        <form onSubmit={handleProductSubmit} className="space-y-4 pt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>نام</Label>
                                    <Input value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} required />
                                </div>
                                <div>
                                    <Label>دسته‌بندی</Label>
                                    <Select onValueChange={val => setNewProduct({ ...newProduct, categoryId: val })} required>
                                        <SelectTrigger>
                                            <SelectValue placeholder="انتخاب کنید" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>قیمت (ریال)</Label>
                                    <Input type="number" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} required />
                                </div>
                                <div>
                                    <Label>تخفیف (درصد)</Label>
                                    <Input type="number" value={newProduct.discountPercentage} onChange={e => setNewProduct({ ...newProduct, discountPercentage: e.target.value })} required min="0" max="100" />
                                </div>
                                <div>
                                    <Label>واحد شمارش</Label>
                                    <Select value={newProduct.unit || "عدد"} onValueChange={val => setNewProduct({ ...newProduct, unit: val })} required>
                                        <SelectTrigger>
                                            <SelectValue placeholder="انتخاب واحد" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="عدد">عدد</SelectItem>
                                            <SelectItem value="بسته">بسته</SelectItem>
                                            <SelectItem value="کیلوگرم">کیلوگرم</SelectItem>
                                            <SelectItem value="شیشه">شیشه</SelectItem>
                                            <SelectItem value="دبه">دبه</SelectItem>
                                            <SelectItem value="حلب">حلب</SelectItem>
                                            <SelectItem value="شیل">شیل</SelectItem>
                                            <SelectItem value="قوطی">قوطی</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>مقدار موجودی</Label>
                                    <Input type="number" min={0} value={newProduct.stock ?? 0} onChange={e => setNewProduct({ ...newProduct, stock: Number(e.target.value) })} required />
                                </div>
                            </div>
                            <div>
                                <Label>آدرس عکس</Label>
                                <Input value={newProduct.image} onChange={e => setNewProduct({ ...newProduct, image: e.target.value })} placeholder="یا عکس را آپلود کنید" />
                                <div className="flex items-center gap-2 mt-2">
                                    <input type="file" accept="image/*" id="product-image-upload" style={{ display: "none" }}
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            setActionLoading("upload");
                                            const formData = new FormData();
                                            formData.append("image", file);
                                            try {
                                                const res = await fetch(`https://api.imgbb.com/1/upload?key=${process.env.NEXT_PUBLIC_IMGBB_API_KEY}`, { method: "POST", body: formData });
                                                const data = await res.json();
                                                if (data.success) {
                                                    setNewProduct((prev) => ({ ...prev, image: data.data.url }));
                                                    alert("آپلود موفقیت‌آمیز بود!");
                                                } else {
                                                    alert("آپلود عکس موفق نبود.");
                                                }
                                            } catch (err) {
                                                alert("خطا در آپلود عکس");
                                            } finally {
                                                setActionLoading(null);
                                            }
                                        }}
                                    />
                                    <Button type="button" variant="outline" size="sm" disabled={actionLoading === "upload"} onClick={() => document.getElementById("product-image-upload")?.click()}>
                                        {actionLoading === "upload" ? <Loader2 className="animate-spin h-4 w-4" /> : "آپلود عکس"}
                                    </Button>
                                    {newProduct.image && (<img src={newProduct.image} alt="پیش‌نمایش" className="h-10 w-10 rounded object-cover border ml-2" />)}
                                </div>
                            </div>
                            <div>
                                <Label>توضیحات</Label>
                                <Textarea value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} />
                            </div>
                            <DialogFooter>
                                <DialogClose asChild id="add-product-close">
                                    <Button type="button" variant="secondary">انصراف</Button>
                                </DialogClose>
                                <Button type="submit" disabled={actionLoading === 'new'}>
                                    {actionLoading === 'new' ? <Loader2 className="animate-spin" /> : "ذخیره"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
            <Card>
                <CardContent className="mt-6">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-right">عکس</TableHead>
                                <TableHead className="text-right">نام</TableHead>
                                <TableHead className="text-right">قیمت</TableHead>
                                <TableHead className="text-right">تخفیف</TableHead>
                                <TableHead className="text-right">وضعیت</TableHead>
                                <TableHead className="text-right">واحد</TableHead>
                                <TableHead className="text-right">موجودی</TableHead>
                                <TableHead className="text-center">عملیات</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {products.map(p => (
                                <TableRow key={p.id}>
                                    <TableCell className="text-right">
                                        <img src={p.image || "/placeholder.svg"} alt={p.name} className="h-12 w-12 rounded-md object-cover" />
                                    </TableCell>
                                    <TableCell className="text-right font-medium">{p.name}</TableCell>
                                    <TableCell className="text-right">{p.price.toLocaleString('fa-IR')} ریال</TableCell>
                                    <TableCell className="text-right">{p.discountPercentage > 0 ? `${p.discountPercentage}%` : '-'}</TableCell>
                                    <TableCell className="text-right"><Badge variant={p.available ? 'default' : 'destructive'}>{p.available ? "موجود" : "ناموجود"}</Badge></TableCell>
                                    <TableCell className="text-right">{p.unit}</TableCell>
                                    <TableCell className="text-right">{p.stock}</TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <Button size="sm" variant="outline" onClick={() => setEditingProduct(p)} aria-label="ویرایش">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button size="sm" variant="destructive" aria-label="حذف">حذف</Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>حذف محصول</DialogTitle>
                                                    </DialogHeader>
                                                    <p>آیا مطمئن هستید که می‌خواهید محصول "{p.name}" را حذف کنید؟ این عملیات غیرقابل بازگشت است.</p>
                                                    <DialogFooter>
                                                        <DialogClose asChild>
                                                            <Button variant="secondary">انصراف</Button>
                                                        </DialogClose>
                                                        <Button variant="destructive" onClick={async () => {
                                                            setActionLoading(p.id);
                                                            try {
                                                                const res = await fetch(`/api/products/${p.id}`, { method: "DELETE" });
                                                                if (!res.ok) throw new Error("خطا در حذف محصول");
                                                                await fetchProductsAndCategories();
                                                            } catch (e) {
                                                                alert("خطا در حذف محصول");
                                                            } finally {
                                                                setActionLoading(null);
                                                            }
                                                        }} disabled={actionLoading === p.id}>تایید حذف</Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
                <DialogContent dir="rtl" className="sm:max-w-lg">
                    <DialogHeader><DialogTitle>ویرایش محصول: {editingProduct?.name}</DialogTitle></DialogHeader>
                    {editingProduct && (
                        <form onSubmit={handleProductUpdate} className="space-y-4 pt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div><Label>نام محصول</Label><Input value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} required/></div>
                                <div><Label>دسته‌بندی</Label><Select value={editingProduct.categoryId} onValueChange={val => setEditingProduct({...editingProduct, categoryId: val})} required><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
                                <div><Label>قیمت (ریال)</Label><Input type="number" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value) || 0})} required/></div>
                                <div><Label>تخفیف (درصد)</Label><Input type="number" value={editingProduct.discountPercentage} onChange={e => setEditingProduct({...editingProduct, discountPercentage: parseInt(e.target.value) || 0})} required min="0" max="100"/></div>
                                <div><Label>واحد شمارش</Label><Select value={editingProduct.unit} onValueChange={val => setEditingProduct({...editingProduct, unit: val})} required><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                                    <SelectItem value="عدد">عدد</SelectItem>
                                    <SelectItem value="بسته">بسته</SelectItem>
                                    <SelectItem value="کیلوگرم">کیلوگرم</SelectItem>
                                    <SelectItem value="شیشه">شیشه</SelectItem>
                                    <SelectItem value="دبه">دبه</SelectItem>
                                    <SelectItem value="حلب">حلب</SelectItem>
                                    <SelectItem value="شیل">شیل</SelectItem>
                                    <SelectItem value="قوطی">قوطی</SelectItem>
                                </SelectContent></Select></div>
                                <div><Label>مقدار موجودی</Label><Input type="number" min={0} value={editingProduct.stock ?? 0} onChange={e => setEditingProduct({...editingProduct, stock: Number(e.target.value)})} required/></div>
                            </div>
                            <div>
                                <Label>آدرس عکس</Label>
                                <Input value={editingProduct.image || ""} onChange={e => setEditingProduct({...editingProduct, image: e.target.value})} />
                                <div className="flex items-center gap-2 mt-2">
                                    <input type="file" accept="image/*" id="product-image-upload-edit" style={{ display: "none" }}
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            setActionLoading("upload");
                                            const formData = new FormData();
                                            formData.append("image", file);
                                            try {
                                                const res = await fetch(`https://api.imgbb.com/1/upload?key=${process.env.NEXT_PUBLIC_IMGBB_API_KEY}`, { method: "POST", body: formData });
                                                const data = await res.json();
                                                if (data.success) {
                                                    setEditingProduct((prev) => prev ? { ...prev, image: data.data.url } : prev);
                                                    alert("آپلود موفقیت‌آمیز بود!");
                                                } else {
                                                    alert("آپلود عکس موفق نبود.");
                                                }
                                            } catch (err) {
                                                alert("خطا در آپلود عکس");
                                            } finally {
                                                setActionLoading(null);
                                            }
                                        }}
                                    />
                                    <Button type="button" variant="outline" size="sm" disabled={actionLoading === "upload"} onClick={() => document.getElementById("product-image-upload-edit")?.click()}>
                                        {actionLoading === "upload" ? <Loader2 className="animate-spin h-4 w-4" /> : "آپلود عکس"}
                                    </Button>
                                    {editingProduct.image && (<img src={editingProduct.image} alt="پیش‌نمایش" className="h-10 w-10 rounded object-cover border ml-2" />)}
                                </div>
                            </div>
                            <div><Label>توضیحات</Label><Textarea value={editingProduct.description || ""} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} /></div>
                            <div className="flex items-center space-x-2"><Switch id="availability" checked={editingProduct.available} onCheckedChange={(checked) => setEditingProduct({...editingProduct, available: checked})} /><Label htmlFor="availability">موجود است</Label></div>
                            <DialogFooter>
                                <Button type="button" variant="secondary" onClick={() => setEditingProduct(null)}>انصراف</Button>
                                <Button type="submit" disabled={actionLoading === editingProduct.id}>
                                    {actionLoading === editingProduct.id ? <Loader2 className="animate-spin" /> : "ذخیره تغییرات"}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

// --- Category Management ---
function CategoryManagementPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newCategory, setNewCategory] = useState({ name: "", icon: "", image: "" });
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchCategories = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/categories');
            setCategories(await res.json());
        } catch(e) { console.error(e); } finally { setIsLoading(false); }
    };
    useEffect(() => { fetchCategories(); }, []);

    const handleCategorySubmit = async (e: FormEvent) => {
        e.preventDefault();
        setActionLoading('new');
        try {
            await fetch('/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newCategory)
            });
            await fetchCategories();
            setNewCategory({ name: "", icon: "", image: "" });
            (document.getElementById('add-category-close') as HTMLButtonElement)?.click();
        } catch (e) { alert("خطا"); } finally { setActionLoading(null); }
    };

    const handleCategoryUpdate = async (e: FormEvent) => {
        e.preventDefault();
        if (!editingCategory) return;
        setActionLoading(editingCategory.id);
        try {
            await fetch(`/api/categories/${editingCategory.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingCategory)
            });
            await fetchCategories();
            setEditingCategory(null);
        } catch (e) { alert("خطا در ویرایش"); } finally { setActionLoading(null); }
    };

    if (isLoading) return <p className="text-center py-10">در حال بارگذاری...</p>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">مدیریت دسته‌بندی‌ها</h1>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button><PlusCircle className="ml-2 h-4 w-4" />افزودن دسته‌بندی</Button>
                    </DialogTrigger>
                    <DialogContent dir="rtl">
                        <DialogHeader><DialogTitle>افزودن دسته‌بندی جدید</DialogTitle></DialogHeader>
                        <form onSubmit={handleCategorySubmit} className="space-y-4 pt-4">
                            <div>
                                <Label>نام دسته‌بندی</Label>
                                <Input value={newCategory.name} onChange={e => setNewCategory({...newCategory, name: e.target.value})} required/>
                            </div>
                            <div>
                                <Label>آیکون (Emoji)</Label>
                                <Input value={newCategory.icon} onChange={e => setNewCategory({...newCategory, icon: e.target.value})} placeholder="مثلاً: 🌭"/>
                            </div>
                            <div>
                                <Label>آدرس عکس دسته‌بندی</Label>
                                <Input value={newCategory.image || ""} onChange={e => setNewCategory({ ...newCategory, image: e.target.value })} placeholder="یا عکس را آپلود کنید" />
                                <div className="flex items-center gap-2 mt-2">
                                    <input type="file" accept="image/*" id="category-image-upload" style={{ display: "none" }}
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            setActionLoading("upload");
                                            const formData = new FormData();
                                            formData.append("image", file);
                                            try {
                                                const res = await fetch(`https://api.imgbb.com/1/upload?key=${process.env.NEXT_PUBLIC_IMGBB_API_KEY}`, { method: "POST", body: formData });
                                                const data = await res.json();
                                                if (data.success) {
                                                    setNewCategory((prev) => ({ ...prev, image: data.data.url }));
                                                    alert("آپلود موفقیت‌آمیز بود!");
                                                } else {
                                                    alert("آپلود عکس موفق نبود.");
                                                }
                                            } catch (err) {
                                                alert("خطا در آپلود عکس");
                                            } finally {
                                                setActionLoading(null);
                                            }
                                        }}
                                    />
                                    <Button type="button" variant="outline" size="sm" disabled={actionLoading === "upload"} onClick={() => document.getElementById("category-image-upload")?.click()}>
                                        {actionLoading === "upload" ? <Loader2 className="animate-spin h-4 w-4" /> : "آپلود عکس"}
                                    </Button>
                                    {newCategory.image && (<img src={newCategory.image} alt="پیش‌نمایش" className="h-10 w-10 rounded object-cover border ml-2" />)}
                                </div>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild id="add-category-close">
                                    <Button type="button" variant="secondary">انصراف</Button>
                                </DialogClose>
                                <Button type="submit" disabled={actionLoading === 'new'}>
                                    {actionLoading === 'new' ? <Loader2 className="animate-spin" /> : "ذخیره"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
            {categories.length > 0 ? (
                <Card>
                    <CardContent className="mt-6">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-right">تصویر</TableHead>
                                    <TableHead className="text-right">نام</TableHead>
                                    <TableHead className="text-center">عملیات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {categories.map(c => (
                                    <TableRow key={c.id}>
                                        <TableCell className="text-right">
                                            {c.image
                                                ? <img src={c.image} alt={c.name} className="h-10 w-10 rounded object-cover border" />
                                                : <span className="text-2xl">{c.icon}</span>
                                            }
                                        </TableCell>
                                        <TableCell className="text-right font-medium">{c.name}</TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Button size="sm" variant="outline" onClick={() => setEditingCategory(c)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button size="sm" variant="destructive" aria-label="حذف">حذف</Button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                        <DialogHeader>
                                                            <DialogTitle>حذف دسته‌بندی</DialogTitle>
                                                        </DialogHeader>
                                                        <p>آیا مطمئن هستید که می‌خواهید دسته‌بندی "{c.name}" را حذف کنید؟ این عملیات غیرقابل بازگشت است.</p>
                                                        <DialogFooter>
                                                            <DialogClose asChild>
                                                                <Button variant="secondary">انصراف</Button>
                                                            </DialogClose>
                                                            <Button variant="destructive" onClick={async () => {
                                                                setActionLoading(c.id);
                                                                try {
                                                                    const res = await fetch(`/api/categories/${c.id}`, { method: "DELETE" });
                                                                    if (!res.ok) throw new Error("خطا در حذف دسته‌بندی");
                                                                    await fetchCategories();
                                                                } catch (e) {
                                                                    alert("خطا در حذف دسته‌بندی");
                                                                } finally {
                                                                    setActionLoading(null);
                                                                }
                                                            }} disabled={actionLoading === c.id}>تایید حذف</Button>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            ) : (
                <p className="text-center py-10 text-muted-foreground">هنوز دسته‌بندی‌ای اضافه نشده است.</p>
            )}
            <Dialog open={!!editingCategory} onOpenChange={() => setEditingCategory(null)}>
                <DialogContent dir="rtl">
                    <DialogHeader><DialogTitle>ویرایش دسته‌بندی: {editingCategory?.name}</DialogTitle></DialogHeader>
                    {editingCategory && (
                        <form onSubmit={handleCategoryUpdate} className="space-y-4 pt-4">
                            <div>
                                <Label>نام دسته‌بندی</Label>
                                <Input value={editingCategory.name} onChange={e => setEditingCategory({...editingCategory, name: e.target.value})} required/>
                            </div>
                            <div>
                                <Label>آیکون (Emoji)</Label>
                                <Input value={editingCategory.icon || ""} onChange={e => setEditingCategory({...editingCategory, icon: e.target.value})} />
                            </div>
                            <div>
                                <Label>آدرس عکس دسته‌بندی</Label>
                                <Input value={editingCategory.image || ""} onChange={e => setEditingCategory({...editingCategory, image: e.target.value})} />
                                <div className="flex items-center gap-2 mt-2">
                                    <input type="file" accept="image/*" id="category-image-upload-edit" style={{ display: "none" }}
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            setActionLoading("upload");
                                            const formData = new FormData();
                                            formData.append("image", file);
                                            try {
                                                const res = await fetch(`https://api.imgbb.com/1/upload?key=${process.env.NEXT_PUBLIC_IMGBB_API_KEY}`, { method: "POST", body: formData });
                                                const data = await res.json();
                                                if (data.success) {
                                                    setEditingCategory((prev) => ({ ...prev, image: data.data.url }));
                                                    alert("آپلود موفقیت‌آمیز بود!");
                                                } else {
                                                    alert("آپلود عکس موفق نبود.");
                                                }
                                            } catch (err) {
                                                alert("خطا در آپلود عکس");
                                            } finally {
                                                setActionLoading(null);
                                            }
                                        }}
                                    />
                                    <Button type="button" variant="outline" size="sm" disabled={actionLoading === "upload"} onClick={() => document.getElementById("category-image-upload-edit")?.click()}>
                                        {actionLoading === "upload" ? <Loader2 className="animate-spin h-4 w-4" /> : "آپلود عکس"}
                                    </Button>
                                    {editingCategory.image && (<img src={editingCategory.image} alt="پیش‌نمایش" className="h-10 w-10 rounded object-cover border ml-2" />)}
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="secondary" onClick={() => setEditingCategory(null)}>انصراف</Button>
                                <Button type="submit" disabled={actionLoading === editingCategory.id}>
                                    {actionLoading === editingCategory.id ? <Loader2 className="animate-spin" /> : "ذخیره تغییرات"}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}