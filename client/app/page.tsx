// FILE: app/page.tsx (The final, complete, unified, and bug-fixed version)
"use client";

import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { Search, ShoppingCart, Plus, Minus, ArrowRight, Download, Share, Home, List, LogOut, History, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import type { Product as PrismaProduct, Category as PrismaCategory } from "@prisma/client";
import type { CartItem, OrderWithItems } from "@/types";
import ProductCard from "@/components/shared/ProductCard";
import BottomNavigation from "@/components/layout/BottomNavigation";
import { useAppContext } from "@/context/AppContext";

// --- Type definition for props to pass to page components ---
interface PageProps {
    user: any;
    handleLogout: () => void;
    orders: OrderWithItems[];
    isLoadingOrders: boolean;
    handleSelectProduct: (p: PrismaProduct) => void;
    handleNavigateToCategories: () => void;
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    selectedCategory: string;
    setSelectedCategory: (c: string) => void;
    products: (PrismaProduct & { category: PrismaCategory })[];
    categories: PrismaCategory[];
    cart: CartItem[];
    addToCart: (p: PrismaProduct, q?: number) => void;
    updateCartQuantity: (id: string, q: number) => void;
    removeFromCart: (id: string) => void;
    getTotalItems: () => number;
    getTotalPrice: () => number;
    formatPrice: (p: number) => string;
    deliverySlot: string;
    setDeliverySlot: (s: string) => void;
    orderNotes: string;
    setOrderNotes: (n: string) => void;
    handleOrderSubmit: () => void;
    isSubmitting: boolean;
    selectedProduct: (PrismaProduct & { category: PrismaCategory }) | null;
    setCurrentPage: (p: string) => void;
    setCart: (cart: CartItem[]) => void;
}

// --- Main Controller Component (Top Level) ---
export default function WholesaleFoodApp() {
  const { user, isLoadingUser } = useAppContext();

  if (isLoadingUser) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-50"><p className="text-lg font-medium text-gray-600">در حال بارگذاری...</p></div>;
  }

  if (user) {
    const isProfileComplete = user.name && user.shopName && user.shopAddress;
    return isProfileComplete ? <AppContent /> : <CompleteProfilePage />;
  }
  
  return <AuthPage />;
}

// --- Authentication Page Component (Top Level) ---
function AuthPage() {
    const { setUser } = useAppContext();
    const [loginPhone, setLoginPhone] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [registerPhone, setRegisterPhone] = useState("");
    const [registerPassword, setRegisterPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("login");

    const handleRegister = async (e: FormEvent) => {
        e.preventDefault(); setIsLoading(true); setError("");
        try {
            const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: registerPhone, password: registerPassword }) });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "خطایی رخ داده است.");
            alert("ثبت نام با موفقیت انجام شد! لطفاً از تب ورود، وارد شوید.");
            setActiveTab("login");
        } catch (err: any) { setError(err.message); } finally { setIsLoading(false); }
    };

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault(); setIsLoading(true); setError("");
        try {
            const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: loginPhone, password: loginPassword }) });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "شماره یا رمز عبور اشتباه است.");
            setUser(data);
        } catch (err: any) { setError(err.message); } finally { setIsLoading(false); }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4" dir="rtl">
            <Card className="w-full max-w-md"><CardHeader className="text-center"><CardTitle>به بنک‌شاپ خوش آمدید</CardTitle><CardDescription>برای ادامه وارد شوید یا ثبت‌نام کنید</CardDescription></CardHeader><CardContent><Tabs value={activeTab} onValueChange={setActiveTab} className="w-full"><TabsList className="grid w-full grid-cols-2"><TabsTrigger value="login">ورود</TabsTrigger><TabsTrigger value="register">ثبت نام</TabsTrigger></TabsList><TabsContent value="login"><form onSubmit={handleLogin} className="space-y-4 pt-4"><div className="space-y-2"><Label htmlFor="login-phone">شماره تلفن</Label><Input id="login-phone" type="tel" placeholder="09123456789" required value={loginPhone} onChange={(e) => setLoginPhone(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="login-password">رمز عبور</Label><Input id="login-password" type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} /></div>{error && activeTab === 'login' && <p className="text-sm text-red-500 text-center">{error}</p>}<Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> در حال ورود...</> : "ورود"}</Button></form></TabsContent><TabsContent value="register"><form onSubmit={handleRegister} className="space-y-4 pt-4"><div className="space-y-2"><Label htmlFor="register-phone">شماره تلفن</Label><Input id="register-phone" type="tel" placeholder="09123456789" required value={registerPhone} onChange={(e) => setRegisterPhone(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="register-password">رمز عبور</Label><Input id="register-password" type="password" required value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} /></div>{error && activeTab === 'register' && <p className="text-sm text-red-500 text-center">{error}</p>}<Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> در حال ثبت نام...</> : "ثبت نام"}</Button></form></TabsContent></Tabs></CardContent></Card>
        </div>
    );
}

// --- Complete Profile Page (Top Level) ---
function CompleteProfilePage() {
    const { user, setUser } = useAppContext();
    const [formData, setFormData] = useState({ name: user?.name || "", shopName: user?.shopName || "", shopAddress: user?.shopAddress || "", landline: user?.landline || "" });
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => { setFormData({ ...formData, [e.target.name]: e.target.value }); };
    const handleSubmit = async (e: FormEvent) => {
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
            <Card className="w-full max-w-md"><CardHeader className="text-center"><CardTitle>تکمیل پروفایل</CardTitle><CardDescription>برای ثبت فاکتور، لطفاً اطلاعات فروشگاه خود را کامل کنید.</CardDescription></CardHeader><CardContent><form onSubmit={handleSubmit} className="space-y-4"><div className="space-y-2"><Label htmlFor="name">نام و نام خانوادگی</Label><Input id="name" name="name" required value={formData.name} onChange={handleChange} /></div><div className="space-y-2"><Label htmlFor="shopName">نام فروشگاه</Label><Input id="shopName" name="shopName" required value={formData.shopName} onChange={handleChange} /></div><div className="space-y-2"><Label htmlFor="shopAddress">آدرس دقیق فروشگاه</Label><Input id="shopAddress" name="shopAddress" required value={formData.shopAddress} onChange={handleChange} /></div><div className="space-y-2"><Label htmlFor="landline">تلفن ثابت (اختیاری)</Label><Input id="landline" name="landline" value={formData.landline} onChange={handleChange} /></div>{error && <p className="text-sm text-red-500 text-center">{error}</p>}<Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> در حال ذخیره...</> : "ذخیره و ادامه"}</Button></form></CardContent></Card>
        </div>
    );
}

// --- Main Application Component (Top Level) ---
function AppContent() {
    const { user, setUser, cart, setCart, currentPage, setCurrentPage, ...appContext } = useAppContext();
    const { addToCart, updateCartQuantity, removeFromCart, getTotalPrice, getTotalItems, setSelectedProduct, selectedProduct } = appContext;
    
    const [products, setProducts] = useState<(PrismaProduct & { category: PrismaCategory })[]>([]);
    const [categories, setCategories] = useState<PrismaCategory[]>([]);
    const [isLoadingContent, setIsLoadingContent] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [deliverySlot, setDeliverySlot] = useState("");
    const [orderNotes, setOrderNotes] = useState("");
    const [orders, setOrders] = useState<OrderWithItems[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoadingContent(true);
            try {
                const [productsRes, categoriesRes, ordersRes] = await Promise.all([ fetch('/api/products'), fetch('/api/categories'), fetch('/api/orders') ]);
                if (!productsRes.ok || !categoriesRes.ok || !ordersRes.ok) throw new Error("Failed to load initial data");
                setProducts(await productsRes.json());
                setCategories(await categoriesRes.json());
                setOrders(await ordersRes.json());
            } catch (e) { console.error(e); alert("خطا در بارگذاری اطلاعات فروشگاه."); } 
            finally { setIsLoadingContent(false); }
        };
        if ("Notification" in window && Notification.permission !== "granted") { Notification.requestPermission(); }
        fetchInitialData();
    }, []);

    const handleLogout = async () => { try { await fetch('/api/auth/logout', { method: 'POST' }); setUser(null); } catch (e) { console.error(e); } };
    const handleSelectProduct = (p: PrismaProduct) => { setSelectedProduct(p); setCurrentPage("product"); };
    const handleNavigateToCategories = () => { setSelectedCategory(""); setCurrentPage("category"); };
    const formatPrice = (p: number) => p.toLocaleString("fa-IR") + " ریال";

    const handleOrderSubmit = async () => {
        if (!deliverySlot) { alert("لطفاً زمان تحویل را انتخاب کنید."); return; }
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cart, totalPrice: getTotalPrice(), deliverySlot, notes: orderNotes }) });
            if (!res.ok) throw new Error("Failed to submit order");
            const newOrder = await res.json() as OrderWithItems;
            setOrders(prevOrders => [newOrder, ...prevOrders]); 
            setCart([]);
            setOrderNotes("");
            setCurrentPage("invoice");
        } catch (e) { console.error(e); alert("خطا در ثبت سفارش!"); }
        finally { setIsSubmitting(false); }
    };

    const props = { user, handleLogout, orders, isLoadingOrders: isLoadingContent, handleSelectProduct, handleNavigateToCategories, searchQuery, setSearchQuery, selectedCategory, setSelectedCategory, products, categories, cart, addToCart, updateCartQuantity, removeFromCart, getTotalItems, getTotalPrice, formatPrice, deliverySlot, setDeliverySlot, orderNotes, setOrderNotes, handleOrderSubmit, isSubmitting, selectedProduct, setCurrentPage, setCart };

    const renderPage = () => {
        if (isLoadingContent) {
            return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="mr-4">در حال بارگذاری فروشگاه...</p></div>;
        }
        switch (currentPage) {
            case "home": return <HomePage {...props} />;
            case "category": return <CategoryPage {...props} />;
            case "cart": return <CartPage {...props} />;
            case "invoice": return <InvoicePage {...props} />;
            case "order_history": return <OrderHistoryPage {...props} />;
            case "product": return <ProductDetailPage {...props} />;
            default: return <HomePage {...props} />;
        }
    };

    return (
      <div className="min-h-screen bg-gray-50" dir="rtl">
        {renderPage()}
        <BottomNavigation currentPage={currentPage} totalCartItems={getTotalItems()} onNavigate={setCurrentPage} onNavigateToCategories={handleNavigateToCategories} />
      </div>
    );
}

// --- Page Components (Top-Level) ---

function HomePage(props: PageProps) {
    const { user, handleLogout, orders, isLoadingOrders, handleSelectProduct, handleNavigateToCategories, searchQuery, setSearchQuery, categories, products, cart, addToCart, updateCartQuantity } = props;
    const mostRecentOrder = orders.length > 0 ? orders[0] : null;
    const featuredProducts = products.slice(0, 4);
    const renderProductList = (list: PrismaProduct[]) => (<div className="grid grid-cols-2 gap-4">{list.map(p => <ProductCard key={p.id} product={p} cartItem={cart.find((ci) => ci.id === p.id)} onAddToCart={addToCart} onSelectProduct={handleSelectProduct} onUpdateQuantity={updateCartQuantity} />)}</div>);
    return (
        <div className="pb-20">
            <div className="p-4 flex justify-between items-center bg-gray-50 border-b"><h1 className="font-bold text-lg text-green-800">سلام، {user?.name}!</h1><Button variant="ghost" size="icon" onClick={handleLogout} className="text-red-500"><LogOut className="h-5 w-5" /></Button></div>
            {!isLoadingOrders && mostRecentOrder && mostRecentOrder.items.length > 0 && (<div className="p-4"><h2 className="text-xl font-bold text-green-800 mb-4">سفارش های اخیر</h2><div className="flex space-x-4 space-x-reverse overflow-x-auto pb-4">{mostRecentOrder.items.map(item => { const productDetails = products.find(p => p.name === item.productName); return (<div key={item.id} className="flex-shrink-0 w-28 text-center cursor-pointer" onClick={() => productDetails && handleSelectProduct(productDetails)}><img src={productDetails?.image || "/placeholder.svg"} className="h-20 w-20 object-cover rounded-lg mx-auto mb-2" alt={item.productName} /><p className="text-xs truncate">{item.productName}</p></div>)})}</div></div>)}
            <div className="p-4"><div className="relative"><Search className="absolute right-4 top-3 h-5 w-5 text-gray-400" /><Input placeholder="جستجوی محصولات..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-12 pl-4 h-12 text-lg rounded-2xl" /></div></div>
            <div className="p-4"><h2 className="text-xl font-bold text-green-800 mb-4">دسته‌بندی‌ها</h2><div className="grid grid-cols-2 gap-3">{categories.map(c => <Button key={c.id} variant="outline" className="h-20 flex flex-col items-center justify-center gap-2" onClick={() => { props.setSelectedCategory(c.id); props.setCurrentPage("category"); }}><span className="text-2xl">{c.icon}</span><span className="text-sm">{c.name}</span></Button>)}</div></div>
            <div className="p-4"><div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold text-green-800">محصولات ویژه</h2><Button variant="ghost" className="text-green-600" onClick={handleNavigateToCategories}>مشاهده همه <ArrowRight className="mr-2 h-4 w-4" /></Button></div>{renderProductList(featuredProducts)}</div>
        </div>
    );
}

function CategoryPage(props: PageProps) {
    const { selectedCategory, searchQuery, setSearchQuery, products, cart, addToCart, handleSelectProduct, updateCartQuantity, setCurrentPage, categories } = props;
    const filteredProducts = products.filter((p) => (selectedCategory ? p.categoryId === selectedCategory : true) && p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const renderProductList = (list: any[]) => (<div className="grid grid-cols-2 gap-4">{list.map(p => <ProductCard key={p.id} product={p} cartItem={cart.find((ci:any) => ci.id === p.id)} onAddToCart={addToCart} onSelectProduct={handleSelectProduct} onUpdateQuantity={updateCartQuantity} />)}</div>);
    return (<div className="pb-20"><div className="sticky top-0 bg-white z-10 p-4 border-b"><div className="flex items-center gap-4 mb-4"><Button variant="ghost" size="icon" onClick={() => setCurrentPage("home")}><ArrowRight className="h-6 w-6" /></Button><h1 className="text-xl font-bold">{selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : "همه محصولات"}</h1></div><div className="relative"><Search className="absolute right-4 top-3 h-5 w-5 text-gray-400" /><Input placeholder="جستجو..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-12" /></div></div><div className="p-4">{filteredProducts.length > 0 ? renderProductList(filteredProducts) : <p className="text-center py-10">محصولی یافت نشد.</p>}</div></div>);
}

function ProductDetailPage(props: PageProps) {
    const { selectedProduct, addToCart, setCurrentPage, formatPrice } = props;
    const [quantity, setQuantity] = useState(1);
    if (!selectedProduct) { setCurrentPage("home"); return null; }
    return (<div className="pb-20"><div className="sticky top-0 bg-white z-10 p-4 border-b"><div className="flex items-center gap-4"><Button variant="ghost" size="icon" onClick={() => setCurrentPage("category")}><ArrowRight className="h-6 w-6" /></Button><h1 className="text-lg font-bold">جزئیات محصول</h1></div></div><div className="p-4"><div className="text-center mb-6"><img src={selectedProduct.image || "/placeholder.svg"} alt={selectedProduct.name} className="h-48 w-48 object-cover rounded-2xl mx-auto mb-4" /><h2 className="text-2xl font-bold">{selectedProduct.name}</h2><div className="text-2xl font-bold text-green-600">{formatPrice(selectedProduct.price)}</div></div><Card className="mb-6 rounded-2xl"><CardContent className="p-6"><h3 className="font-bold">توضیحات</h3><p>{selectedProduct.description}</p></CardContent></Card>{selectedProduct.available ? <Card><CardContent className="p-6"><div className="flex items-center justify-between mb-6"><span className="text-lg">تعداد:</span><div className="flex items-center gap-4"><Button variant="outline" size="icon" onClick={() => setQuantity(q => Math.max(1, q - 1))}><Minus/></Button><span className="text-xl font-bold">{quantity}</span><Button variant="outline" size="icon" onClick={() => setQuantity(q => q + 1)}><Plus/></Button></div></div><Button className="w-full h-14" onClick={() => { addToCart(selectedProduct, quantity); setCurrentPage("cart"); }}><ShoppingCart className="ml-2" /> افزودن به سبد</Button></CardContent></Card> : <Card><CardContent><p>این محصول موجود نیست.</p></CardContent></Card>}</div></div>);
}

function OrderHistoryPage(props: PageProps) {
    const { orders, isLoadingOrders, formatPrice, setCurrentPage } = props;
    return (<div className="pb-20"><div className="sticky top-0 bg-white z-10 p-4 border-b"><div className="flex items-center gap-4"><Button variant="ghost" size="icon" onClick={() => setCurrentPage("home")}><ArrowRight className="h-6 w-6" /></Button><h1 className="text-xl font-bold">تاریخچه سفارشات</h1></div></div><div className="p-4 space-y-4">{isLoadingOrders ? <p className="text-center py-10">در حال بارگذاری...</p> : orders.length > 0 ? orders.map((order: OrderWithItems) => (<Card key={order.id} className="rounded-2xl"><CardHeader><div className="flex justify-between items-center"><CardTitle>سفارش: ...{order.id.substring(18)}</CardTitle><Badge variant={order.status === 'SHIPPED' ? 'default' : 'secondary'}>{order.status === 'PENDING' ? 'در حال بررسی' : 'ارسال شده'}</Badge></div><CardDescription>تاریخ: {new Date(order.createdAt).toLocaleDateString("fa-IR")} - مجموع: {formatPrice(order.totalPrice)}</CardDescription></CardHeader><CardContent><p className="font-semibold mb-2">اقلام:</p><ul className="list-disc list-inside text-sm">{order.items.map((item: any) => (<li key={item.id}>{item.productName} (تعداد: {item.quantity})</li>))}</ul>{order.notes && <p className="text-sm mt-3"><span className="font-semibold">توضیحات:</span> {order.notes}</p>}<p className="text-sm font-medium mt-3">زمان تحویل: {order.deliverySlot}</p></CardContent></Card>)) : <p className="text-center py-10">سفارشی ثبت نشده.</p>}</div></div>);
}

function CartPage(props: PageProps) {
    const { cart, updateCartQuantity, removeFromCart, getTotalItems, getTotalPrice, formatPrice, deliverySlot, setDeliverySlot, orderNotes, setOrderNotes, handleOrderSubmit, isSubmitting, setCurrentPage, products } = props;
    return (<div className="pb-20"><div className="sticky top-0 bg-white z-10 p-4 border-b"><div className="flex items-center gap-4"><Button variant="ghost" size="icon" onClick={() => setCurrentPage("home")}><ArrowRight className="h-6 w-6" /></Button><h1 className="text-xl font-bold">سبد خرید</h1></div></div><div className="p-4">{cart.length > 0 ? (<><div className="space-y-4 mb-6">{cart.map((item: CartItem) => { const productDetail = products.find(p=>p.id === item.id); return (<Card key={item.id}><CardContent className="p-4"><div className="flex gap-4"><img src={productDetail?.image || "/placeholder.svg"} alt={item.name} className="h-20 w-20 rounded-xl object-cover" /><div className="flex-1"><h3 className="font-medium mb-2">{item.name}</h3><div className="text-green-600 font-bold mb-3">{formatPrice(item.price)}</div><div className="flex items-center justify-between"><div className="flex items-center gap-3"><Button variant="outline" size="icon" onClick={() => updateCartQuantity(item.id, item.quantity - 1)}><Minus className="h-3 w-3" /></Button><span>{item.quantity}</span><Button variant="outline" size="icon" onClick={() => updateCartQuantity(item.id, item.quantity + 1)}><Plus className="h-3 w-3" /></Button></div><Button variant="destructive" size="sm" onClick={() => removeFromCart(item.id)}>حذف</Button></div></div></div></CardContent></Card>)})}</div><Card className="rounded-2xl border-2"><CardContent className="p-6"><div className="space-y-3 mb-6"><div className="flex justify-between"><span>اقلام:</span><span>{getTotalItems()}</span></div><div className="flex justify-between font-bold text-xl"><span>مجموع:</span><span>{formatPrice(getTotalPrice())}</span></div></div><div className="space-y-2 my-4"><Label htmlFor="notes">توضیحات سفارش (اختیاری)</Label><Textarea id="notes" placeholder="مثلاً: فاکتور رسمی نیاز است." value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)} /></div><div className="space-y-2 my-4"><Label>زمان تحویل</Label><Select onValueChange={setDeliverySlot} value={deliverySlot} dir="rtl"><SelectTrigger><SelectValue placeholder="انتخاب کنید" /></SelectTrigger><SelectContent><SelectItem value="امروز - بعد از ظهر">امروز - بعد از ظهر</SelectItem><SelectItem value="فردا - صبح">فردا - صبح</SelectItem><SelectItem value="فردا - بعد از ظهر">فردا - بعد از ظهر</SelectItem></SelectContent></Select></div><Button className="w-full h-14 text-lg" onClick={handleOrderSubmit} disabled={!deliverySlot || isSubmitting}>{isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> در حال ثبت...</> : "ثبت نهایی"}</Button></CardContent></Card></>) : (<div className="text-center py-12"><div className="text-6xl mb-4">🛒</div><h3>سبد خرید خالی است</h3> <Button onClick={() => setCurrentPage("home")} className="hover:bg-green-700 rounded-2xl px-7 h-10 text-lg mt-4">شروع خرید</Button></div>)}</div></div>);
}
    
function InvoicePage(props: PageProps) {
    const { user, orders, formatPrice, setCart, setCurrentPage } = props;
    const [invoiceNumber, setInvoiceNumber] = useState("");
    const lastSubmittedOrder = orders.length > 0 ? orders[0] : null;
    useEffect(() => { setInvoiceNumber("BONAK-" + Math.random().toString(36).substring(2, 9).toUpperCase()); }, []);
    const handleNewOrder = () => { setCart([]); setCurrentPage("home"); };
    return (<div className="pb-20"><div className="sticky top-0 bg-white z-10 p-4 border-b"><div className="flex items-center gap-4"><Button variant="ghost" size="icon" onClick={handleNewOrder}><ArrowRight className="h-6 w-6" /></Button><h1 className="text-xl font-bold">فاکتور</h1></div></div><div className="p-4"><Card className="mb-6"><CardContent className="p-6"><div className="text-center mb-6"><div className="text-4xl mb-2">✅</div><h2>سفارش ثبت شد</h2></div><div className="space-y-4 mb-6"><div className="flex justify-between"><span>شماره فاکتور:</span><span className="font-bold">{invoiceNumber}</span></div><div className="flex justify-between"><span>تاریخ:</span><span className="font-bold">{new Date().toLocaleDateString("fa-IR")}</span></div><div className="flex justify-between"><span>مشتری:</span><span className="font-bold">{user?.name} ({user?.shopName})</span></div><div className="flex justify-between"><span>آدرس:</span><span className="font-bold">{user?.shopAddress}</span></div></div><Separator className="my-6" /><h3 className="font-bold mb-3">اقلام:</h3><div className="space-y-3 mb-6">{lastSubmittedOrder?.items.map((item:any) => <div key={item.id} className="flex justify-between"><span>{item.productName} (×{item.quantity})</span><span>{formatPrice(item.price*item.quantity)}</span></div>)}</div><Separator className="my-6" /><div className="flex justify-between font-bold text-xl"><span>مجموع:</span><span>{formatPrice(lastSubmittedOrder?.totalPrice || 0)}</span></div></CardContent></Card><div className="grid grid-cols-2 gap-4"><Button variant="outline"><Download className="ml-2 h-4 w-4" />دانلود</Button><Button variant="outline"><Share className="ml-2 h-4 w-4" />اشتراک</Button></div><Button onClick={handleNewOrder} className="w-full mt-4">سفارش جدید</Button></div></div>);
}
