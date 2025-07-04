// FILE: app/page.tsx (The final, complete, unified, and bug-fixed version)
"use client";

import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { Search, ShoppingCart, Plus, Minus, ArrowRight, Download, Share, Home, List, LogOut, History, Send, Loader2, User as UserIcon, CalendarIcon, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

import type { Product as PrismaProduct, Category as PrismaCategory, Settlement, OrderItem } from "@prisma/client";
import type { CartItem, OrderWithItems, User } from "@/types";
import ProductCard from "@/components/shared/ProductCard";
import BottomNavigation from "@/components/layout/BottomNavigation";
import { useAppContext } from "@/context/AppContext";
import { ShamsiCalendar } from "@/components/shared/ShamsiCalendar";

// --- Type definition for props to pass to page components ---
interface PageProps {
    user: User | null;
    handleLogout: () => void;
    orders: OrderWithItems[];
    fetchOrders: () => void;
    isLoadingOrders: boolean;
    handleSelectProduct: (p: PrismaProduct) => void;
    handleNavigateToCategories: () => void;
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    selectedCategory: string;
    setSelectedCategory: (c: string) => void;
    products: (PrismaProduct & { category: PrismaCategory })[];
    categories: PrismaCategory[];
    settlements: Settlement[];
    cart: CartItem[];
    addToCart: (p: PrismaProduct, q?: number) => void;
    updateCartQuantity: (id: string, q: number) => void;
    removeFromCart: (id: string) => void;
    getTotalItems: () => number;
    getTotalPrice: () => number;
    getOriginalTotalPrice: () => number;
    formatPrice: (p: number) => string;
    deliveryDate: Date | undefined;
    setDeliveryDate: (d: Date | undefined) => void;
    selectedSettlement: string;
    setSelectedSettlement: (s: string) => void;
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
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("login");

    const handleRegister = async (e: FormEvent) => {
        e.preventDefault(); setIsLoading(true); setError("");
        if (registerPassword !== confirmPassword) {
            setError("رمزهای عبور با یکدیگر مطابقت ندارند.");
            setIsLoading(false);
            return;
        }
        try {
            const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: registerPhone, password: registerPassword, confirmPassword }) });
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
            <Card className="w-full max-w-md"><CardHeader className="text-center"><CardTitle>به بنک‌شاپ خوش آمدید</CardTitle><CardDescription>برای ادامه وارد شوید یا ثبت‌نام کنید</CardDescription></CardHeader><CardContent><Tabs value={activeTab} onValueChange={setActiveTab} className="w-full"><TabsList className="grid w-full grid-cols-2"><TabsTrigger value="login">ورود</TabsTrigger><TabsTrigger value="register">ثبت نام</TabsTrigger></TabsList><TabsContent value="login"><form onSubmit={handleLogin} className="space-y-4 pt-4"><div className="space-y-2"><Label htmlFor="login-phone">شماره تلفن</Label><Input id="login-phone" type="tel" placeholder="09123456789" required value={loginPhone} onChange={(e) => setLoginPhone(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="login-password">رمز عبور</Label><Input id="login-password" type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} /></div>{error && activeTab === 'login' && <p className="text-sm text-red-500 text-center">{error}</p>}<Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> در حال ورود...</> : "ورود"}</Button></form></TabsContent><TabsContent value="register"><form onSubmit={handleRegister} className="space-y-4 pt-4"><div className="space-y-2"><Label htmlFor="register-phone">شماره تلفن</Label><Input id="register-phone" type="tel" placeholder="09123456789" required value={registerPhone} onChange={(e) => setRegisterPhone(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="register-password">رمز عبور</Label><Input id="register-password" type="password" required value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="confirm-password">تکرار رمز عبور</Label><Input id="confirm-password" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /></div>{error && activeTab === 'register' && <p className="text-sm text-red-500 text-center">{error}</p>}<Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> در حال ثبت نام...</> : "ثبت نام"}</Button></form></TabsContent></Tabs></CardContent></Card>
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
    const { addToCart, updateCartQuantity, removeFromCart, getTotalPrice, getOriginalTotalPrice, getTotalItems, setSelectedProduct, selectedProduct } = appContext;
    
    const [products, setProducts] = useState<(PrismaProduct & { category: PrismaCategory })[]>([]);
    const [categories, setCategories] = useState<PrismaCategory[]>([]);
    const [settlements, setSettlements] = useState<Settlement[]>([]);
    const [isLoadingContent, setIsLoadingContent] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [deliveryDate, setDeliveryDate] = useState<Date | undefined>();
    const [selectedSettlement, setSelectedSettlement] = useState("");
    const [orderNotes, setOrderNotes] = useState("");
    const [orders, setOrders] = useState<OrderWithItems[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchOrders = async () => {
        try {
            const ordersRes = await fetch('/api/orders');
            if (ordersRes.ok) {
                setOrders(await ordersRes.json());
            }
        } catch(e) { console.error("Could not refetch orders", e); }
    };

    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoadingContent(true);
            try {
                const [productsRes, categoriesRes, settlementsRes] = await Promise.all([
                    fetch('/api/products'),
                    fetch('/api/categories'),
                    fetch('/api/settlements')
                ]);
                if (!productsRes.ok || !categoriesRes.ok || !settlementsRes.ok) throw new Error("Failed to load initial data");
                setProducts(await productsRes.json());
                setCategories(await categoriesRes.json());
                setSettlements(await settlementsRes.json());
                await fetchOrders(); 
            } catch (e) {
                console.error(e);
                alert("خطا در بارگذاری اطلاعات فروشگاه.");
            } finally {
                setIsLoadingContent(false);
            }
        };
        fetchInitialData();
    }, []);

    const handleLogout = async () => { try { await fetch('/api/auth/logout', { method: 'POST' }); setUser(null); } catch (e) { console.error(e); } };
    const handleSelectProduct = (p: PrismaProduct) => { setSelectedProduct(p); setCurrentPage("product"); };
    const handleNavigateToCategories = () => { setSelectedCategory(""); setCurrentPage("category"); };
    const formatPrice = (p: number) => p.toLocaleString("fa-IR", { useGrouping: false }) + " ریال";

    const handleOrderSubmit = async () => {
        if (!deliveryDate) { alert("لطفاً تاریخ تحویل را انتخاب کنید."); return; }
        if (!selectedSettlement) { alert("لطفاً نوع تسویه را انتخاب کنید."); return; }
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cart, totalPrice: getTotalPrice(), deliveryDate: deliveryDate.toISOString(), settlementId: selectedSettlement, notes: orderNotes }) });
            if (!res.ok) throw new Error("Failed to submit order");
            const newOrder = await res.json() as OrderWithItems;
            setOrders(prevOrders => [newOrder, ...prevOrders]); 
            setCart([]);
            setOrderNotes("");
            setCurrentPage("invoice");
        } catch (e) { console.error(e); alert("خطا در ثبت سفارش!"); }
        finally { setIsSubmitting(false); }
    };

    const props: PageProps = { user, handleLogout, orders, fetchOrders, isLoadingOrders: isLoadingContent, handleSelectProduct, handleNavigateToCategories, searchQuery, setSearchQuery, selectedCategory, setSelectedCategory, products, categories, settlements, cart, addToCart, updateCartQuantity, removeFromCart, getTotalItems, getTotalPrice, getOriginalTotalPrice, formatPrice, deliveryDate, setDeliveryDate, selectedSettlement, setSelectedSettlement, orderNotes, setOrderNotes, handleOrderSubmit, isSubmitting, selectedProduct, setCurrentPage, setCart };

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
            case "profile": return <ProfilePage {...props} />;
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
    const { user, handleLogout, orders, isLoadingOrders, handleSelectProduct, handleNavigateToCategories, searchQuery, setSearchQuery, categories, products, cart, addToCart, updateCartQuantity, setCurrentPage } = props;
    const mostRecentOrder = orders.length > 0 ? orders[0] : null;
    const featuredProducts = products.slice(0, 4);
    const renderProductList = (list: PrismaProduct[]) => (<div className="grid grid-cols-2 gap-4">{list.map(p => <ProductCard key={p.id} product={p as any} cartItem={cart.find((ci) => ci.id === p.id)} onAddToCart={addToCart} onSelectProduct={handleSelectProduct} onUpdateQuantity={updateCartQuantity} />)}</div>);
    return (
        <div className="pb-20">
            <div className="p-4 flex justify-between items-center bg-gray-50 border-b">
                <h1 className="font-bold text-lg text-green-800">سلام، {user?.name}!</h1>
                <div>
                    <Button variant="ghost" size="icon" onClick={() => setCurrentPage('profile')} className="text-gray-600"><UserIcon className="h-5 w-5" /></Button>
                    <Button variant="ghost" size="icon" onClick={handleLogout} className="text-red-500"><LogOut className="h-5 w-5" /></Button>
                </div>
            </div>
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

function ReturnRequestDialog({ order, onOpenChange, onSuccess }: { order: OrderWithItems | null, onOpenChange: () => void, onSuccess: () => void }) {
    const [returnItems, setReturnItems] = useState<{[key: string]: number}>({});
    const [reason, setReason] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    
    useEffect(() => {
        if(order) {
            const initialItems: {[key: string]: number} = {};
            order.items.forEach(item => {
                initialItems[item.id] = 0;
            });
            setReturnItems(initialItems);
        }
    }, [order]);

    const handleQuantityChange = (itemId: string, maxQuantity: number, change: number) => {
        setReturnItems(prev => {
            const currentQuantity = prev[itemId] || 0;
            const newQuantity = Math.max(0, Math.min(maxQuantity, currentQuantity + change));
            return { ...prev, [itemId]: newQuantity };
        });
    };

    const handleSubmitReturn = async () => {
        if (!order) return;
        
        const itemsToReturn = Object.entries(returnItems)
            .filter(([_, quantity]) => quantity > 0)
            .map(([orderItemId, quantity]) => ({ orderItemId, quantity }));

        if(itemsToReturn.length === 0) {
            alert("لطفا حداقل یک محصول برای مرجوعی انتخاب کنید.");
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch('/api/returns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: order.id,
                    reason,
                    items: itemsToReturn,
                })
            });
            if (!res.ok) throw new Error("خطا در ثبت درخواست مرجوعی");
            alert("درخواست مرجوعی با موفقیت ثبت شد.");
            onSuccess();
        } catch(e) {
            console.error(e);
            alert((e as Error).message);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Dialog open={!!order} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>ثبت مرجوعی برای سفارش ...{order?.id.slice(-6)}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <p className="text-sm text-muted-foreground">محصولات و تعداد مورد نظر برای مرجوعی را انتخاب کنید.</p>
                    {order?.items.map((item: OrderItem) => (
                        <div key={item.id} className="flex justify-between items-center border-b pb-2">
                           <div>
                             <p className="font-semibold">{item.productName}</p>
                             <p className="text-xs">تعداد در سفارش: {item.quantity}</p>
                           </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(item.id, item.quantity, -1)}><Minus className="h-4 w-4" /></Button>
                                <span className="w-8 text-center font-bold">{returnItems[item.id] || 0}</span>
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(item.id, item.quantity, 1)}><Plus className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    ))}
                    <div className="space-y-2">
                        <Label htmlFor="reason">دلیل مرجوعی (اختیاری)</Label>
                        <Textarea id="reason" value={reason} onChange={e => setReason(e.target.value)} placeholder="مثلا: تاریخ انقضا گذشته بود." />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="secondary" onClick={onOpenChange}>انصراف</Button>
                    <Button onClick={handleSubmitReturn} disabled={isLoading}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "ثبت درخواست"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function OrderHistoryPage(props: PageProps) {
    const { orders, isLoadingOrders, formatPrice, setCurrentPage, fetchOrders } = props;
    const [selectedOrderForReturn, setSelectedOrderForReturn] = useState<OrderWithItems | null>(null);

    return (
        <div className="pb-20">
            <div className="sticky top-0 bg-white z-10 p-4 border-b">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => setCurrentPage("home")}><ArrowRight className="h-6 w-6" /></Button>
                    <h1 className="text-xl font-bold">تاریخچه سفارشات</h1>
                </div>
            </div>
            <div className="p-4 space-y-4">
                {isLoadingOrders ? (
                    <p className="text-center py-10">در حال بارگذاری...</p>
                ) : orders.length > 0 ? (
                    orders.map((order: OrderWithItems) => (
                        <Card key={order.id} className="rounded-2xl">
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <CardTitle>سفارش: ...{order.id.substring(18)}</CardTitle>
                                    <Badge variant={order.status === 'SHIPPED' ? 'default' : 'secondary'}>{order.status === 'PENDING' ? 'در حال بررسی' : 'ارسال شده'}</Badge>
                                </div>
                                <CardDescription>تاریخ: {new Date(order.createdAt).toLocaleDateString("fa-IR")} - مجموع: {formatPrice(order.totalPrice)}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="font-semibold mb-2">اقلام:</p>
                                <ul className="list-disc list-inside text-sm">
                                    {order.items.map((item: any) => (
                                        <li key={item.id}>{item.productName} (تعداد: {item.quantity})</li>
                                    ))}
                                </ul>
                                {order.notes && <p className="text-sm mt-3"><span className="font-semibold">توضیحات:</span> {order.notes}</p>}
                                <div className="mt-4">
                                     <Button variant="outline" size="sm" onClick={() => setSelectedOrderForReturn(order)}>
                                        <RefreshCw className="ml-2 h-4 w-4" />
                                        ثبت مرجوعی
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <p className="text-center py-10">سفارشی ثبت نشده.</p>
                )}
            </div>
            
            <ReturnRequestDialog 
                order={selectedOrderForReturn} 
                onOpenChange={() => setSelectedOrderForReturn(null)}
                onSuccess={() => {
                    fetchOrders(); 
                    setSelectedOrderForReturn(null);
                }}
            />
        </div>
    );
}

function CartPage(props: PageProps) {
    const { cart, updateCartQuantity, removeFromCart, getTotalPrice, getOriginalTotalPrice, formatPrice, deliveryDate, setDeliveryDate, selectedSettlement, setSelectedSettlement, orderNotes, setOrderNotes, handleOrderSubmit, isSubmitting, setCurrentPage, products, settlements } = props;
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    
    const originalTotal = getOriginalTotalPrice();
    const finalTotal = getTotalPrice();
    const totalDiscount = originalTotal - finalTotal;

    const handleDateSelect = (date: Date) => {
        setDeliveryDate(date);
        setIsCalendarOpen(false);
    };

    return (
        <div className="pb-20">
            <div className="sticky top-0 bg-white z-10 p-4 border-b">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => setCurrentPage("home")}><ArrowRight className="h-6 w-6" /></Button>
                    <h1 className="text-xl font-bold">سبد خرید</h1>
                </div>
            </div>
            <div className="p-4">
                {cart.length > 0 ? (
                    <>
                        <div className="space-y-4 mb-6">
                            {cart.map((item: CartItem) => {
                                const productDetail = products.find(p => p.id === item.id);
                                return (
                                    <Card key={item.id}>
                                        <CardContent className="p-4">
                                            <div className="flex gap-4">
                                                <img src={productDetail?.image || "/placeholder.svg"} alt={item.name} className="h-20 w-20 rounded-xl object-cover" />
                                                <div className="flex-1">
                                                    <h3 className="font-medium mb-2">{item.name}</h3>
                                                    <div className="text-green-600 font-bold mb-3">{formatPrice(item.price)}</div>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <Button variant="outline" size="icon" onClick={() => updateCartQuantity(item.id, item.quantity - 1)}><Minus className="h-3 w-3" /></Button>
                                                            <span>{item.quantity}</span>
                                                            <Button variant="outline" size="icon" onClick={() => updateCartQuantity(item.id, item.quantity + 1)}><Plus className="h-3 w-3" /></Button>
                                                        </div>
                                                        <Button variant="destructive" size="sm" onClick={() => removeFromCart(item.id)}>حذف</Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                        <Card className="rounded-2xl border-2">
                            <CardContent className="p-6">
                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between"><span>مجموع کل (بدون تخفیف):</span><span>{formatPrice(originalTotal)}</span></div>
                                    <div className="flex justify-between text-red-600"><span>مجموع تخفیف:</span><span>{formatPrice(totalDiscount)}</span></div>
                                    <Separator />
                                    <div className="flex justify-between font-bold text-xl"><span>مبلغ نهایی:</span><span>{formatPrice(finalTotal)}</span></div>
                                </div>
                                <div className="space-y-4 my-4">
                                    <div>
                                        <Label>تاریخ تحویل</Label>
                                        <Dialog open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" className="w-full justify-start text-left font-normal">
                                                    <CalendarIcon className="ml-2 h-4 w-4" />
                                                    {deliveryDate ? deliveryDate.toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }) : <span>یک روز را انتخاب کنید</span>}
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="w-[340px] sm:max-w-md p-0">
                                                <ShamsiCalendar onDateSelect={handleDateSelect} initialDate={deliveryDate} minDate={new Date(Date.now() + 86400000)} />
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                    <div>
                                        <Label>توافق تسویه</Label>
                                        <Select onValueChange={setSelectedSettlement} value={selectedSettlement} dir="rtl">
                                            <SelectTrigger><SelectValue placeholder="انتخاب کنید" /></SelectTrigger>
                                            <SelectContent>{settlements.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="notes">توضیحات سفارش (اختیاری)</Label>
                                        <Textarea id="notes" placeholder="مثلاً: فاکتور رسمی نیاز است." value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)} />
                                    </div>
                                </div>
                                <Button className="w-full h-14 text-lg" onClick={handleOrderSubmit} disabled={!deliveryDate || !selectedSettlement || isSubmitting}>
                                    {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> در حال ثبت...</> : "ثبت نهایی"}
                                </Button>
                            </CardContent>
                        </Card>
                    </>
                ) : (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">🛒</div>
                        <h3>سبد خرید خالی است</h3>
                        <Button onClick={() => setCurrentPage("home")} className="hover:bg-green-700 rounded-2xl px-7 h-10 text-lg mt-4">شروع خرید</Button>
                    </div>
                )}
            </div>
        </div>
    );
}

function InvoicePage(props: PageProps) {
    const { user, orders, formatPrice, setCart, setCurrentPage } = props;
    const [invoiceNumber, setInvoiceNumber] = useState("");
    const lastSubmittedOrder = orders.length > 0 ? orders[0] : null;
    useEffect(() => { setInvoiceNumber("BONAK-" + Math.random().toString(36).substring(2, 9).toUpperCase()); }, []);
    const handleNewOrder = () => { setCart([]); setCurrentPage("home"); };
    return (<div className="pb-20"><div className="sticky top-0 bg-white z-10 p-4 border-b"><div className="flex items-center gap-4"><Button variant="ghost" size="icon" onClick={handleNewOrder}><ArrowRight className="h-6 w-6" /></Button><h1 className="text-xl font-bold">فاکتور</h1></div></div><div className="p-4"><Card className="mb-6"><CardContent className="p-6"><div className="text-center mb-6"><div className="text-4xl mb-2">✅</div><h2>سفارش ثبت شد</h2></div><div className="space-y-4 mb-6"><div className="flex justify-between"><span>شماره فاکتور:</span><span className="font-bold">{invoiceNumber}</span></div><div className="flex justify-between"><span>تاریخ:</span><span className="font-bold">{new Date().toLocaleDateString("fa-IR")}</span></div><div className="flex justify-between"><span>مشتری:</span><span className="font-bold">{user?.name} ({user?.shopName})</span></div><div className="flex justify-between"><span>آدرس:</span><span className="font-bold">{user?.shopAddress}</span></div></div><Separator className="my-6" /><h3 className="font-bold mb-3">اقلام:</h3><div className="space-y-3 mb-6">{lastSubmittedOrder?.items.map((item:any) => <div key={item.id} className="flex justify-between"><span>{item.productName} (×{item.quantity})</span><span>{formatPrice(item.price*item.quantity)}</span></div>)}</div><Separator className="my-6" /><div className="flex justify-between font-bold text-xl"><span>مجموع:</span><span>{formatPrice(lastSubmittedOrder?.totalPrice || 0)}</span></div></CardContent></Card><div className="grid grid-cols-2 gap-4"><Button variant="outline"><Download className="ml-2 h-4 w-4" />دانلود</Button><Button variant="outline"><Share className="ml-2 h-4 w-4" />اشتراک</Button></div><Button onClick={handleNewOrder} className="w-full mt-4">سفارش جدید</Button></div></div>);
}

function ProfilePage(props: PageProps) {
    const { user, setUser, setCurrentPage } = useAppContext();
    const [formData, setFormData] = useState({ name: user?.name || "", shopName: user?.shopName || "", shopAddress: user?.shopAddress || "", landline: user?.landline || "" });
    const [passwordData, setPasswordData] = useState({ oldPassword: "", newPassword: "", confirmNewPassword: "" });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleInfoChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handleInfoSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true); setError(""); setSuccess("");
        try {
            const res = await fetch('/api/user/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setUser(data) // Update user in context
            setSuccess("اطلاعات با موفقیت به‌روز شد.");
        } catch (err: any) { setError(err.message); } finally { setIsLoading(false); }
    };
    
    const handlePasswordSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmNewPassword) {
            setError("رمز عبور جدید و تکرار آن مطابقت ندارند.");
            return;
        }
        setIsLoading(true); setError(""); setSuccess("");
        try {
            const res = await fetch('/api/user/change-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(passwordData) });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setSuccess("رمز عبور با موفقیت تغییر کرد.");
            setPasswordData({ oldPassword: "", newPassword: "", confirmNewPassword: "" });
        } catch (err: any) { setError(err.message); } finally { setIsLoading(false); }
    };

    return (
        <div className="pb-20">
            <div className="sticky top-0 bg-white z-10 p-4 border-b flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => setCurrentPage("home")}><ArrowRight className="h-6 w-6" /></Button>
                <h1 className="text-xl font-bold">پروفایل من</h1>
            </div>
            <div className="p-4 space-y-8">
                <Card>
                    <CardHeader><CardTitle>ویرایش اطلاعات</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={handleInfoSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2"><Label htmlFor="name">نام و نام خانوادگی</Label><Input id="name" name="name" value={formData.name} onChange={handleInfoChange} /></div>
                                <div className="space-y-2"><Label htmlFor="shopName">نام فروشگاه</Label><Input id="shopName" name="shopName" value={formData.shopName} onChange={handleInfoChange} /></div>
                            </div>
                            <div className="space-y-2"><Label htmlFor="shopAddress">آدرس</Label><Textarea id="shopAddress" name="shopAddress" value={formData.shopAddress} onChange={handleInfoChange} /></div>
                            <div className="space-y-2"><Label htmlFor="landline">تلفن ثابت</Label><Input id="landline" name="landline" value={formData.landline} onChange={handleInfoChange} /></div>
                            <Button type="submit" disabled={isLoading}>{isLoading ? "در حال ذخیره..." : "ذخیره اطلاعات"}</Button>
                        </form>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>تغییر رمز عبور</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <div className="space-y-2"><Label htmlFor="oldPassword">رمز عبور فعلی</Label><Input type="password" id="oldPassword" name="oldPassword" value={passwordData.oldPassword} onChange={handlePasswordChange} /></div>
                            <div className="space-y-2"><Label htmlFor="newPassword">رمز عبور جدید</Label><Input type="password" id="newPassword" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} /></div>
                            <div className="space-y-2"><Label htmlFor="confirmNewPassword">تکرار رمز عبور جدید</Label><Input type="password" id="confirmNewPassword" name="confirmNewPassword" value={passwordData.confirmNewPassword} onChange={handlePasswordChange} /></div>
                            <Button type="submit" disabled={isLoading}>{isLoading ? "در حال تغییر..." : "تغییر رمز عبور"}</Button>
                        </form>
                    </CardContent>
                </Card>
                {error && <p className="text-sm text-red-500 text-center p-2 bg-red-100 rounded-md">{error}</p>}
                {success && <p className="text-sm text-green-600 text-center p-2 bg-green-100 rounded-md">{success}</p>}
            </div>
        </div>
    );
}