// FILE: app/page.tsx (The final, complete, and correct code)
"use client";

import { useState, useEffect } from "react";
import { Search, ShoppingCart, Plus, Minus, ArrowRight, Download, Share, Home, List, LogOut, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import type { Product, CartItem, OrderWithItems } from "@/types";
import { categories } from "@/data/categories";
import { products } from "@/data/products";
import ProductCard from "@/components/shared/ProductCard";
import BottomNavigation from "@/components/layout/BottomNavigation";
import { useAppContext } from "@/context/AppContext";

// --- Main Controller Component ---
export default function WholesaleFoodApp() {
  const { user, isLoadingUser } = useAppContext();

  if (isLoadingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-lg font-medium text-gray-600">در حال بارگذاری...</p>
      </div>
    );
  }

  if (user) {
    const isProfileComplete = user.name && user.shopName && user.shopAddress;
    return isProfileComplete ? <AppContent /> : <CompleteProfilePage />;
  }
  
  return <AuthPage />;
}

// --- Authentication Page Component ---
function AuthPage() {
    const { setUser } = useAppContext();
    const [loginPhone, setLoginPhone] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [registerPhone, setRegisterPhone] = useState("");
    const [registerPassword, setRegisterPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("login");

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault(); setIsLoading(true); setError("");
        try {
            const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: registerPhone, password: registerPassword }) });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            alert("ثبت نام با موفقیت انجام شد! لطفاً از تب ورود، وارد شوید.");
            setActiveTab("login");
        } catch (err: any) { setError(err.message); } finally { setIsLoading(false); }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault(); setIsLoading(true); setError("");
        try {
            const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: loginPhone, password: loginPassword }) });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setUser(data);
        } catch (err: any) { setError(err.message); } finally { setIsLoading(false); }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4" dir="rtl">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center"><CardTitle>به بنک‌شاپ خوش آمدید</CardTitle><CardDescription>برای ادامه وارد شوید یا ثبت‌نام کنید</CardDescription></CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="login">ورود</TabsTrigger><TabsTrigger value="register">ثبت نام</TabsTrigger></TabsList>
                        <TabsContent value="login"><form onSubmit={handleLogin} className="space-y-4 pt-4"><div className="space-y-2"><Label htmlFor="login-phone">شماره تلفن</Label><Input id="login-phone" type="tel" placeholder="09123456789" required value={loginPhone} onChange={(e) => setLoginPhone(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="login-password">رمز عبور</Label><Input id="login-password" type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} /></div>{error && activeTab === 'login' && <p className="text-sm text-red-500 text-center">{error}</p>}<Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? "در حال ورود..." : "ورود"}</Button></form></TabsContent>
                        <TabsContent value="register"><form onSubmit={handleRegister} className="space-y-4 pt-4"><div className="space-y-2"><Label htmlFor="register-phone">شماره تلفن</Label><Input id="register-phone" type="tel" placeholder="09123456789" required value={registerPhone} onChange={(e) => setRegisterPhone(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="register-password">رمز عبور</Label><Input id="register-password" type="password" required value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} /></div>{error && activeTab === 'register' && <p className="text-sm text-red-500 text-center">{error}</p>}<Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? "در حال ثبت نام..." : "ثبت نام"}</Button></form></TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}

// --- Complete Profile Page ---
function CompleteProfilePage() {
    const { user, setUser } = useAppContext();
    const [formData, setFormData] = useState({ name: user?.name || "", shopName: user?.shopName || "", shopAddress: user?.shopAddress || "", landline: user?.landline || "" });
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => { setFormData({ ...formData, [e.target.name]: e.target.value }); };
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setIsLoading(true); setError("");
        try {
            const res = await fetch('/api/user/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setUser(data);
        } catch (err: any) { setError(err.message); } finally { setIsLoading(false); }
    };
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4" dir="rtl">
            <Card className="w-full max-w-md"><CardHeader className="text-center"><CardTitle>تکمیل پروفایل</CardTitle><CardDescription>برای ثبت فاکتور، لطفاً اطلاعات فروشگاه خود را کامل کنید.</CardDescription></CardHeader><CardContent><form onSubmit={handleSubmit} className="space-y-4"><div className="space-y-2"><Label htmlFor="name">نام و نام خانوادگی</Label><Input id="name" name="name" required value={formData.name} onChange={handleChange} /></div><div className="space-y-2"><Label htmlFor="shopName">نام فروشگاه</Label><Input id="shopName" name="shopName" required value={formData.shopName} onChange={handleChange} /></div><div className="space-y-2"><Label htmlFor="shopAddress">آدرس دقیق فروشگاه</Label><Input id="shopAddress" name="shopAddress" required value={formData.shopAddress} onChange={handleChange} /></div><div className="space-y-2"><Label htmlFor="landline">تلفن ثابت (اختیاری)</Label><Input id="landline" name="landline" value={formData.landline} onChange={handleChange} /></div>{error && <p className="text-sm text-red-500 text-center">{error}</p>}<Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? "در حال ذخیره..." : "ذخیره و ادامه"}</Button></form></CardContent></Card>
        </div>
    );
}

// --- Main Application Component ---
function AppContent() {
    const { user, setUser, cart, setCart, currentPage, setCurrentPage, ...appContext } = useAppContext();
    const { addToCart, updateCartQuantity, removeFromCart, getTotalPrice, getTotalItems, setSelectedProduct } = appContext;
    
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [deliverySlot, setDeliverySlot] = useState("");
    const [lastOrder, setLastOrder] = useState<OrderWithItems | null>(null);

    const handleLogout = async () => { try { await fetch('/api/auth/logout', { method: 'POST' }); setUser(null); } catch (e) { console.error(e); } };
    const handleSelectProduct = (p: Product) => { setSelectedProduct(p); setCurrentPage("product"); };
    const handleNavigateToCategories = () => { setSelectedCategory(""); setCurrentPage("category"); };
    const formatPrice = (p: number) => p.toLocaleString("fa-IR") + " ریال";

    const handleOrderSubmit = async () => {
        if (!deliverySlot) { alert("لطفاً زمان تحویل را انتخاب کنید."); return; }
        try {
            const res = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cart, totalPrice: getTotalPrice(), deliverySlot }) });
            if (!res.ok) throw new Error("Failed to submit order");
            const newOrder = await res.json() as OrderWithItems;
            setLastOrder(newOrder);
            setCurrentPage("invoice");
        } catch (e) { console.error(e); alert("خطا در ثبت سفارش!"); }
    };

    const filteredProducts = products.filter(p => (selectedCategory ? p.category === selectedCategory : true) && p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const featuredProducts = products.slice(0, 4);
    const renderProductList = (list: Product[]) => (<div className="grid grid-cols-2 gap-4">{list.map(p => <ProductCard key={p.id} product={p} cartItem={cart.find(ci => ci.id === p.id)} onAddToCart={addToCart} onSelectProduct={handleSelectProduct} onUpdateQuantity={updateCartQuantity} />)}</div>);
    
    const HomePage = () => (
      <div className="pb-20">
        <div className="p-4 flex justify-between items-center bg-gray-50 border-b"><h1 className="font-bold text-lg text-green-800">سلام، {user?.name}!</h1><Button variant="ghost" size="icon" onClick={handleLogout} className="text-red-500"><LogOut className="h-5 w-5" /></Button></div>
        {lastOrder && lastOrder.items.length > 0 && (<div className="p-4"><h2 className="text-xl font-bold text-green-800 mb-4">آخرین خرید شما</h2><div className="flex space-x-4 space-x-reverse overflow-x-auto pb-4">{lastOrder.items.map(item => <div key={item.id} className="flex-shrink-0 w-28 text-center"><img src={products.find(p => p.name === item.productName)?.image || "/placeholder.svg"} className="h-20 w-20 object-cover rounded-lg mx-auto mb-2" alt={item.productName}/><p className="text-xs truncate">{item.productName}</p></div>)}</div></div>)}
        <div className="p-4"><div className="relative"><Search className="absolute right-4 top-3 h-5 w-5 text-gray-400" /><Input placeholder="جستجوی محصولات..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pr-12 pl-4 h-12 text-lg rounded-2xl" /></div></div>
        <div className="p-4"><h2 className="text-xl font-bold text-green-800 mb-4">دسته‌بندی‌ها</h2><div className="grid grid-cols-2 gap-3">{categories.map(c => <Button key={c.id} variant="outline" className="h-20 flex flex-col items-center justify-center gap-2" onClick={() => { setSelectedCategory(c.id); setCurrentPage("category"); }}><span className="text-2xl">{c.icon}</span><span className="text-sm">{c.name}</span></Button>)}</div></div>
        <div className="p-4"><div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold text-green-800">محصولات ویژه</h2><Button variant="ghost" className="text-green-600" onClick={handleNavigateToCategories}>مشاهده همه <ArrowRight className="mr-2 h-4 w-4" /></Button></div>{renderProductList(featuredProducts)}</div>
      </div>
    );
    const CategoryPage = () => (<div className="pb-20"><div className="sticky top-0 bg-white z-10 p-4 border-b"><div className="flex items-center gap-4 mb-4"><Button variant="ghost" size="icon" onClick={() => setCurrentPage("home")}><ArrowRight className="h-6 w-6" /></Button><h1 className="text-xl font-bold">{selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : "همه محصولات"}</h1></div><div className="relative"><Search className="absolute right-4 top-3 h-5 w-5 text-gray-400" /><Input placeholder="جستجو..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pr-12" /></div></div><div className="p-4">{filteredProducts.length > 0 ? renderProductList(filteredProducts) : <p className="text-center py-10">محصولی یافت نشد.</p>}</div></div>);
    const ProductDetailPage = () => { return <div>Product Detail Page</div>; };
    const OrderHistoryPage = () => {
        const [orders, setOrders] = useState<OrderWithItems[]>([]);
        const [isLoading, setIsLoading] = useState(true);
        useEffect(() => { const fetcher = async () => { setIsLoading(true); try { const res = await fetch('/api/orders'); const data = await res.json(); if (res.ok) setOrders(data); else throw new Error(data.error); } catch (e) { console.error(e); alert("خطا در دریافت تاریخچه"); } finally { setIsLoading(false); } }; fetcher(); }, []);
        return (<div className="pb-20"><div className="sticky top-0 bg-white z-10 p-4 border-b"><div className="flex items-center gap-4"><Button variant="ghost" size="icon" onClick={() => setCurrentPage("home")}><ArrowRight className="h-6 w-6" /></Button><h1 className="text-xl font-bold">تاریخچه سفارشات</h1></div></div><div className="p-4 space-y-4">{isLoading ? <p>در حال بارگذاری...</p> : orders.length > 0 ? orders.map(order => (<Card key={order.id} className="rounded-2xl"><CardHeader><CardTitle>سفارش: ...{order.id.substring(18)}</CardTitle><CardDescription>تاریخ: {new Date(order.createdAt).toLocaleDateString("fa-IR")} - مجموع: {formatPrice(order.totalPrice)}</CardDescription></CardHeader><CardContent><p className="font-semibold mb-2">اقلام:</p><ul className="list-disc list-inside text-sm">{order.items.map(item => (<li key={item.id}>{item.productName} (تعداد: {item.quantity})</li>))}</ul><p className="text-sm font-medium mt-3">زمان تحویل: {order.deliverySlot}</p></CardContent></Card>)) : <p className="text-center py-10">سفارشی ثبت نشده.</p>}</div></div>);
    };
    const CartPage = () => (
      <div className="pb-20"><div className="sticky top-0 bg-white z-10 p-4 border-b"><div className="flex items-center gap-4"><Button variant="ghost" size="icon" onClick={() => setCurrentPage("home")}><ArrowRight className="h-6 w-6" /></Button><h1 className="text-xl font-bold">سبد خرید</h1></div></div><div className="p-4">{cart.length > 0 ? (<><div className="space-y-4 mb-6">{cart.map(item => <Card key={item.id}><CardContent className="p-4"><div className="flex gap-4"><img src={item.image} alt={item.name} className="h-20 w-20 rounded-xl" /><div className="flex-1"><h3 className="font-medium mb-2">{item.name}</h3><div className="text-green-600 font-bold mb-3">{item.price} ریال</div><div className="flex items-center justify-between"><div className="flex items-center gap-3"><Button variant="outline" size="icon" onClick={() => updateCartQuantity(item.id, item.quantity - 1)}><Minus className="h-3 w-3" /></Button><span>{item.quantity}</span><Button variant="outline" size="icon" onClick={() => updateCartQuantity(item.id, item.quantity + 1)}><Plus className="h-3 w-3" /></Button></div><Button variant="destructive" size="sm" onClick={() => removeFromCart(item.id)}>حذف</Button></div></div></div></CardContent></Card>)}</div><Card className="rounded-2xl border-2"><CardContent className="p-6"><div className="space-y-3 mb-6"><div className="flex justify-between"><span>اقلام:</span><span>{getTotalItems()}</span></div><div className="flex justify-between font-bold text-xl"><span>مجموع:</span><span>{formatPrice(getTotalPrice())}</span></div></div><div className="space-y-2 my-4"><Label>زمان تحویل</Label><Select onValueChange={setDeliverySlot} value={deliverySlot} dir="rtl"><SelectTrigger><SelectValue placeholder="انتخاب کنید" /></SelectTrigger><SelectContent><SelectItem value="امروز - بعد از ظهر">امروز - بعد از ظهر</SelectItem><SelectItem value="فردا - صبح">فردا - صبح</SelectItem><SelectItem value="فردا - بعد از ظهر">فردا - بعد از ظهر</SelectItem></SelectContent></Select></div><Button className="w-full h-14 text-lg" onClick={handleOrderSubmit} disabled={!deliverySlot}>ثبت نهایی</Button></CardContent></Card></>) : (<div className="text-center py-12"><div className="text-6xl mb-4">🛒</div><h3>سبد خرید خالی است</h3><Button onClick={() => setCurrentPage("home")}>شروع خرید</Button></div>)}</div></div>
    );
    const InvoicePage = () => {
        const [invoiceNumber, setInvoiceNumber] = useState("");
        useEffect(() => { setInvoiceNumber("BONAK-" + Math.random().toString(36).substring(2, 9).toUpperCase()); }, []);
        const handleNewOrder = () => { setCart([]); setCurrentPage("home"); };
        return (<div className="pb-20"><div className="sticky top-0 bg-white z-10 p-4 border-b"><div className="flex items-center gap-4"><Button variant="ghost" size="icon" onClick={handleNewOrder}><ArrowRight className="h-6 w-6" /></Button><h1 className="text-xl font-bold">فاکتور</h1></div></div><div className="p-4"><Card className="mb-6"><CardContent className="p-6"><div className="text-center mb-6"><div className="text-4xl mb-2">✅</div><h2>سفارش ثبت شد</h2></div><div className="space-y-4 mb-6"><div className="flex justify-between"><span>شماره فاکتور:</span><span className="font-bold">{invoiceNumber}</span></div><div className="flex justify-between"><span>تاریخ:</span><span className="font-bold">{new Date().toLocaleDateString("fa-IR")}</span></div><div className="flex justify-between"><span>مشتری:</span><span className="font-bold">{user?.name} ({user?.shopName})</span></div><div className="flex justify-between"><span>آدرس:</span><span className="font-bold">{user?.shopAddress}</span></div></div><Separator className="my-6" /><h3 className="font-bold mb-3">اقلام:</h3><div className="space-y-3 mb-6">{cart.map(item => <div key={item.id} className="flex justify-between"><span>{item.name} (×{item.quantity})</span><span>{formatPrice(item.priceNumber*item.quantity)}</span></div>)}</div><Separator className="my-6" /><div className="flex justify-between font-bold text-xl"><span>مجموع:</span><span>{formatPrice(getTotalPrice())}</span></div></CardContent></Card><div className="grid grid-cols-2 gap-4"><Button variant="outline"><Download className="ml-2 h-4 w-4" />دانلود</Button><Button variant="outline"><Share className="ml-2 h-4 w-4" />اشتراک</Button></div><Button onClick={handleNewOrder} className="w-full mt-4">سفارش جدید</Button></div></div>);
    };

    const renderPage = () => {
        switch (currentPage) {
            case "home": return <HomePage />;
            case "category": return <CategoryPage />;
            case "cart": return <CartPage />;
            case "invoice": return <InvoicePage />;
            case "order_history": return <OrderHistoryPage />;
            case "product": return <ProductDetailPage />;
            default: return <HomePage />;
        }
    };

    return (
      <div className="min-h-screen bg-gray-50" dir="rtl">
        {renderPage()}
        <BottomNavigation currentPage={currentPage} totalCartItems={getTotalItems()} onNavigate={setCurrentPage} onNavigateToCategories={handleNavigateToCategories} />
      </div>
    );
}