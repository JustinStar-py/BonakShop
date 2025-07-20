"use client";

// Import necessary hooks and components from React and other libraries
import { useState, useEffect, useMemo, FormEvent, ChangeEvent } from "react";
import {
    DollarSign, ShoppingCart, Users, LogOut, Package, ListPlus,
    PlusCircle, Pencil, Loader2, Send, Building, Truck as TruckIcon, Upload, Trash2,
    FileText, ArrowRight, MapPin, Phone, User as UserIconLucide, RefreshCw, Filter, X
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useAppContext } from "@/context/AppContext";
import type { Category, Product, Order, User, Supplier, Distributor, OrderItem, OrderStatus, ReturnRequest, ReturnRequestItem, ReturnStatus } from "@prisma/client";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import dynamic from 'next/dynamic';
import { LatLngTuple } from "leaflet";

// --- Type Definitions for Delivery & Procurement Pages ---
type OrderWithRelations = Order & {
    user: { name: string | null; shopName: string | null; shopAddress: string | null; phone: string; latitude: number | null; longitude: number | null; };
    items: OrderItem[];
};

type ReturnForDelivery = ReturnRequest & {
    order: { user: { name: string | null; shopName: string | null; shopAddress: string | null; phone: string; } };
    items: (ReturnRequestItem & { orderItem: { productName: string } })[];
}

interface ProcurementDetail {
    customerName: string;
    quantity: number;
}

interface ProcurementItem extends Product {
    neededDate: string;
    neededQuantity: number;
    details: ProcurementDetail[];
}

const MapPicker = dynamic(() => import('@/components/shared/MapPicker'), {
    ssr: false,
    loading: () => <div className="h-64 w-full bg-gray-200 animate-pulse rounded-md flex items-center justify-center"><p>در حال بارگذاری نقشه...</p></div>
});


// --- Helper function to format currency in Persian format ---
function formatPrice(price: number) {
    if (typeof price !== 'number' || isNaN(price)) return "۰ ریال";
    return price.toLocaleString('fa-IR') + " ریال";
}

// --- Status Info Helpers ---
const getOrderStatusInfo = (status: OrderStatus): { text: string; variant: "default" | "secondary" | "destructive" } => {
    const map = { PENDING: { text: "در حال بررسی", variant: "secondary" as "secondary" }, SHIPPED: { text: "ارسال شده", variant: "default" as "default" }, DELIVERED: { text: "تحویل داده شد", variant: "default" as "default" }, CANCELED: { text: "لغو شده", variant: "destructive" as "destructive" } };
    return map[status];
};

const getReturnStatusInfo = (status: ReturnStatus): { text: string; variant: "default" | "secondary" | "destructive" } => {
    const map = { REQUESTED: { text: "درخواست شده", variant: "secondary" as "secondary" }, APPROVED: { text: "تایید شده", variant: "default" as "default" }, REJECTED: { text: "رد شده", variant: "destructive" as "destructive" } };
    return map[status];
};


// --- Main Layout Component for the Admin Panel ---
export default function AdminDashboardLayout() {
    const { user, setUser } = useAppContext();
    const [activePage, setActivePage] = useState("dashboard");

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            setUser(null);
            window.location.href = '/';
        } catch (e) {
            console.error("Logout failed", e);
        }
    };

    if (!user || user.role !== 'ADMIN') {
        return <div className="flex items-center justify-center min-h-screen">دسترسی غیر مجاز.</div>;
    }

    const renderActivePage = () => {
        switch (activePage) {
            case 'products': return <ProductManagementPage />;
            case 'categories': return <CategoryManagementPage />;
            case 'companies': return <CompanyManagementPage />;
            case 'procurement': return <ProcurementPage />;
            case 'delivery': return <DeliveryManagementPage />;
            default: return <DashboardHomePage />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 text-foreground flex" dir="rtl">
            <aside className="w-64 bg-card border-l p-4 flex flex-col justify-between">
                <div>
                    <h2 className="text-2xl font-bold mb-8 text-center text-card-foreground">پنل ادمین</h2>
                    <nav className="space-y-2">
                        <Button variant={activePage === 'dashboard' ? 'secondary' : 'ghost'} className="w-full justify-start gap-2" onClick={() => setActivePage('dashboard')}><DollarSign /> داشبورد</Button>
                        <Button variant={activePage === 'products' ? 'secondary' : 'ghost'} className="w-full justify-start gap-2" onClick={() => setActivePage('products')}><Package /> مدیریت محصولات</Button>
                        <Button variant={activePage === 'categories' ? 'secondary' : 'ghost'} className="w-full justify-start gap-2" onClick={() => setActivePage('categories')}><ListPlus /> مدیریت دسته‌بندی‌ها</Button>
                        <Button variant={activePage === 'companies' ? 'secondary' : 'ghost'} className="w-full justify-start gap-2" onClick={() => setActivePage('companies')}><Building /> مدیریت شرکت‌ها</Button>
                        <Button variant={activePage === 'procurement' ? 'secondary' : 'ghost'} className="w-full justify-start gap-2" onClick={() => setActivePage('procurement')}><TruckIcon /> تدارکات</Button>
                        <Button variant={activePage === 'delivery' ? 'secondary' : 'ghost'} className="w-full justify-start gap-2" onClick={() => setActivePage('delivery')}><TruckIcon /> مدیریت تحویل</Button>
                    </nav>
                </div>
                <Button variant="ghost" onClick={handleLogout} className="w-full justify-start gap-2 text-destructive hover:text-destructive"><LogOut /> خروج</Button>
            </aside>
            <main className="flex-1 p-6 overflow-auto">{renderActivePage()}</main>
        </div>
    );
}

// --- Procurement Page ---
function ProcurementPage() {
    const [rawProcurementList, setRawProcurementList] = useState<ProcurementItem[]>([]);
    const [allDistributors, setAllDistributors] = useState<Distributor[]>([]);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [filterDistributor, setFilterDistributor] = useState<string>('all');
    const [filterProduct, setFilterProduct] = useState<string>('all');
    const [filterDate, setFilterDate] = useState<string>('all');

    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedItemDetails, setSelectedItemDetails] = useState<ProcurementItem | null>(null);

    useEffect(() => {
        const calculateProcurement = async () => {
            setIsLoading(true);
            try {
                const [productsRes, ordersRes, distributorsRes] = await Promise.all([
                    fetch('/api/products'),
                    fetch('/api/admin/orders'),
                    fetch('/api/distributors')
                ]);
                if (!productsRes.ok || !ordersRes.ok || !distributorsRes.ok) throw new Error("Failed to fetch data");

                const products: (Product & { supplier: Supplier, distributor: Distributor })[] = await productsRes.json();
                const allOrders: OrderWithRelations[] = await ordersRes.json();
                const distributors: Distributor[] = await distributorsRes.json();

                setAllProducts(products);
                setAllDistributors(distributors);

                const pendingOrders = allOrders.filter(o => o.status === 'PENDING' || o.status === 'SHIPPED');

                const productDemand: Record<string, { product: any, details: ProcurementDetail[] }> = {};

                pendingOrders.forEach(order => {
                    const deliveryDateStr = new Date(order.deliveryDate).toISOString().split('T')[0];
                    order.items.forEach(item => {
                        const product = products.find((p: Product) => p.name === item.productName);
                        if (product) {
                            const key = `${product.id}-${deliveryDateStr}`;
                            if (!productDemand[key]) {
                                productDemand[key] = { product, details: [] };
                            }
                            productDemand[key].details.push({
                                customerName: order.user.shopName || order.user.name || 'نامشخص',
                                quantity: item.quantity
                            });
                        }
                    });
                });
                
                const procurementList = Object.entries(productDemand).map(([key, { product, details }]) => {
                    const neededDate = key.split(product.id + '-')[1];
                    return {
                        ...product,
                        neededDate,
                        neededQuantity: details.reduce((sum, d) => sum + d.quantity, 0),
                        details
                    };
                });


                setRawProcurementList(procurementList);

            } catch (error) { console.error("Failed to calculate procurement list:", error); }
            finally { setIsLoading(false); }
        };
        calculateProcurement();
    }, []);

    const filteredAndGroupedList = useMemo(() => {
        let items = rawProcurementList;
        if (filterDistributor !== 'all') {
            items = items.filter(item => item.distributorId === filterDistributor);
        }
        if (filterProduct !== 'all') {
            items = items.filter(item => item.id === filterProduct);
        }
        if (filterDate !== 'all') {
            items = items.filter(item => item.neededDate === filterDate);
        }

        const grouped = items.reduce((acc, item) => {
            const distributorName = item.distributor.name;
            if (!acc[distributorName]) acc[distributorName] = [];
            acc[distributorName].push(item);
            return acc;
        }, {} as Record<string, ProcurementItem[]>);

        Object.keys(grouped).forEach(distributor => {
            grouped[distributor].sort((a, b) => new Date(a.neededDate).getTime() - new Date(b.neededDate).getTime());
        });

        return Object.entries(grouped);
    }, [rawProcurementList, filterDistributor, filterProduct, filterDate]);
    
    const uniqueDates = useMemo(() => {
        const dates = new Set(rawProcurementList.map(item => item.neededDate));
        return Array.from(dates).sort((a,b) => new Date(a).getTime() - new Date(b).getTime());
    }, [rawProcurementList]);

    const handleOpenDetails = (item: ProcurementItem) => {
        setSelectedItemDetails(item);
        setIsDetailsModalOpen(true);
    };

    if (isLoading) return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">تدارکات و سفارش از پخش‌کننده‌ها</h1>
            <p className="text-muted-foreground">لیست هوشمند محصولات مورد نیاز برای ارسال‌های پیش رو، گروه‌بندی شده بر اساس شرکت پخش‌کننده و تاریخ.</p>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5"/> فیلترها</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                        <Label>شرکت پخش</Label>
                        <Select value={filterDistributor} onValueChange={setFilterDistributor} dir="rtl"><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">همه شرکت‌ها</SelectItem>{allDistributors.map(d=><SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select>
                    </div>
                    <div className="space-y-1.5">
                        <Label>محصول</Label>
                        <Select value={filterProduct} onValueChange={setFilterProduct} dir="rtl"><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">همه محصولات</SelectItem>{allProducts.map(p=><SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select>
                    </div>
                     <div className="space-y-1.5">
                        <Label>تاریخ نیاز</Label>
                        <Select value={filterDate} onValueChange={setFilterDate} dir="rtl"><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">همه تاریخ‌ها</SelectItem>{uniqueDates.map(d=><SelectItem key={d} value={d}>{new Date(d).toLocaleDateString('fa-IR')}</SelectItem>)}</SelectContent></Select>
                    </div>
                    <div className="flex items-end">
                       <Button variant="outline" onClick={() => { setFilterDistributor('all'); setFilterProduct('all'); setFilterDate('all'); }} className="w-full"><X className="ml-2 h-4 w-4"/>پاک کردن فیلترها</Button>
                    </div>
                </CardContent>
            </Card>


            {filteredAndGroupedList.length === 0 ? (
                <Card><CardContent className="pt-6 text-center text-muted-foreground">با توجه به فیلترها، موردی برای تدارکات یافت نشد.</CardContent></Card>
            ) : (
                filteredAndGroupedList.map(([distributorName, products]) => (
                    <Card key={distributorName}>
                        <CardHeader><CardTitle>شرکت پخش: {distributorName}</CardTitle></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader><TableRow><TableHead className="text-right">تاریخ نیاز</TableHead><TableHead className="text-right">محصول (تولیدکننده)</TableHead><TableHead className="text-right">تعداد مورد نیاز</TableHead><TableHead className="text-center">عملیات</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {products.map(p => (
                                        <TableRow key={`${p.id}-${p.neededDate}`}>
                                            <TableCell className="text-right">{new Date(p.neededDate).toLocaleDateString('fa-IR')}</TableCell>
                                            <TableCell className="font-medium text-right">{p.name} <span className="text-muted-foreground text-xs">({p.supplier.name})</span></TableCell>
                                            <TableCell className="font-bold text-right">{p.neededQuantity.toLocaleString('fa-IR')} {p.unit}</TableCell>
                                            <TableCell className="text-center">
                                                <Button variant="ghost" size="sm" onClick={() => handleOpenDetails(p)}>جزئیات</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                ))
            )}

            <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>جزئیات نیاز محصول</DialogTitle>
                        <DialogDescription>{selectedItemDetails?.name} برای تاریخ {new Date(selectedItemDetails?.neededDate || '').toLocaleDateString('fa-IR')}</DialogDescription>
                    </DialogHeader>
                    <div className="max-h-80 overflow-y-auto">
                        <Table>
                            <TableHeader><TableRow><TableHead className="text-right">نام فروشگاه</TableHead><TableHead className="text-center">تعداد سفارش</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {selectedItemDetails?.details.map((detail, index) => (
                                    <TableRow key={index}><TableCell className="text-right">{detail.customerName}</TableCell><TableCell className="text-center">{detail.quantity}</TableCell></TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setIsDetailsModalOpen(false)}>بستن</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}


// --- Dashboard Home Page ---
function DashboardHomePage() {
    const [stats, setStats] = useState<any>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setIsLoading(true);
            try {
                const res = await fetch('/api/admin/dashboard');
                if (res.ok) setStats(await res.json());
            } catch (e) { console.error("Failed to fetch dashboard data", e); }
            finally { setIsLoading(false); }
        };
        fetchDashboardData();
    }, []);

    if (isLoading) return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;

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
                        <ul className="space-y-4">{stats.customerStats?.map((stat: any) => (<li key={stat.name} className="flex items-center justify-between"><div><p className="font-semibold">{stat.name}</p><p className="text-xs text-muted-foreground">{stat.count} سفارش</p></div><p className="font-mono text-primary">{formatPrice(stat.total)}</p></li>))}</ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// --- Delivery Management Page ---
function DeliveryManagementPage() {
    const [allOrders, setAllOrders] = useState<OrderWithRelations[]>([]);
    const [allReturns, setAllReturns] = useState<ReturnForDelivery[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [ordersRes, returnsRes] = await Promise.all([
                fetch('/api/delivery-orders'),
                fetch('/api/returns')
            ]);
            if (ordersRes.ok) setAllOrders(await ordersRes.json());
            if (returnsRes.ok) setAllReturns(await returnsRes.json());
        } catch (error) {
            console.error("Failed to fetch data for delivery management", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">مدیریت تحویل و مرجوعی</h1>
            <Tabs defaultValue="orders" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="orders">سفارشات</TabsTrigger>
                    <TabsTrigger value="returns">مرجوعی‌ها</TabsTrigger>
                </TabsList>
                <TabsContent value="orders" className="pt-4">
                    <OrdersPanel orders={allOrders} isLoading={isLoading} refreshData={fetchData} />
                </TabsContent>
                <TabsContent value="returns" className="pt-4">
                    <ReturnsPanel returns={allReturns} isLoading={isLoading} refreshData={fetchData} />
                </TabsContent>
            </Tabs>
        </div>
    )
}

// --- Orders Panel Component for Delivery ---
function OrdersPanel({orders, isLoading, refreshData}: {orders: OrderWithRelations[], isLoading: boolean, refreshData: () => void}) {
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const handleStatusChange = async (orderId: string, status: OrderStatus) => {
        setActionLoading(orderId);
        try {
            const res = await fetch(`/api/orders/${orderId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (!res.ok) throw new Error("خطا در به‌روزرسانی وضعیت");
            await refreshData();
        } catch (error) {
            alert((error as Error).message);
        } finally {
            setActionLoading(null);
        }
    };

    const ordersByStatus = useMemo(() => {
        const shipped = orders.filter((o) => o.status === 'SHIPPED');
        const delivered = orders.filter((o) => o.status === 'DELIVERED');
        const others = orders.filter((o) => o.status !== 'SHIPPED' && o.status !== 'DELIVERED');
        return { shipped, delivered, others };
    }, [orders]);

    const OrderCard = ({ order }: { order: OrderWithRelations }) => (
        <Card className="flex flex-col" dir="rtl">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle className="text-base font-bold">{order.user.shopName || order.user.name}</CardTitle>
                    <Badge variant={getOrderStatusInfo(order.status).variant}>{getOrderStatusInfo(order.status).text}</Badge>
                </div>
                <div className="text-xs text-muted-foreground space-y-1 pt-2">
                    <p>
                        <span className="font-semibold">تاریخ سفارش: </span>
                        {new Date(order.createdAt).toLocaleDateString('fa-IR')}
                    </p>
                    <p>
                        <span className="font-semibold">تاریخ تحویل: </span>
                        {new Date(order.deliveryDate).toLocaleDateString('fa-IR')}
                    </p>
                </div>
                <div className="space-y-1.5 text-sm text-muted-foreground pt-2 border-t mt-2">
                    <p className="flex items-center gap-2"><UserIconLucide className="h-4 w-4" />{order.user.name}</p>
                    <p className="flex items-start gap-2"><Building className="h-4 w-4 mt-1 shrink-0" />{order.user.shopAddress}</p>
                    <p className="flex items-center gap-2"><Phone className="h-4 w-4" />{order.user.phone}</p>
                </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 mt-auto">
                <Dialog><DialogTrigger asChild><Button variant="outline" className="w-full"><FileText className="ml-2 h-4 w-4"/>مشاهده فاکتور</Button></DialogTrigger><DialogContent className="max-w-sm"><CardHeader><CardTitle>فاکتور سفارش</CardTitle><CardDescription>شماره: ...{order.id.slice(-6)}</CardDescription></CardHeader><CardContent className="space-y-3 text-sm">{order.items.map(item => (<div key={item.id} className="flex justify-between"><span>{item.productName} (×{item.quantity})</span><span>{formatPrice(item.price * item.quantity)}</span></div>))}<Separator /><div className="flex justify-between font-bold"><span>مبلغ کل:</span><span>{formatPrice(order.totalPrice)}</span></div></CardContent></DialogContent></Dialog>
                {order.user.latitude && order.user.longitude && <Dialog><DialogTrigger asChild><Button variant="outline" className="w-full"><MapPin className="ml-2 h-4 w-4"/>نمایش روی نقشه</Button></DialogTrigger><DialogContent><MapPicker readOnly marker={{ position: [order.user.latitude, order.user.longitude], popupText: order.user.shopName || 'موقعیت'}}/></DialogContent></Dialog>}
                <div className="flex items-center gap-2">
                    <Select onValueChange={(value) => handleStatusChange(order.id, value as OrderStatus)} defaultValue={order.status} disabled={actionLoading === order.id}><SelectTrigger className="w-full"><SelectValue placeholder="تغییر وضعیت..." /></SelectTrigger><SelectContent><SelectItem value="PENDING">در حال بررسی</SelectItem><SelectItem value="SHIPPED">ارسال شده</SelectItem><SelectItem value="DELIVERED">تحویل داده شد</SelectItem><SelectItem value="CANCELED">لغو شده</SelectItem></SelectContent></Select>
                    {actionLoading === order.id && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
                </div>
            </CardContent>
        </Card>
    );

    if (isLoading) return <div className="text-center pt-10"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>;
    if (orders.length === 0) return <div className="text-center pt-10 text-gray-500"><Package className="mx-auto h-12 w-12" /><p className="mt-4">هیچ سفارشی یافت نشد.</p></div>;

    return (
        <Tabs defaultValue="shipped" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="shipped">آماده تحویل ({ordersByStatus.shipped.length})</TabsTrigger>
                <TabsTrigger value="delivered">تحویل شده ({ordersByStatus.delivered.length})</TabsTrigger>
                <TabsTrigger value="others">سایر ({ordersByStatus.others.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="shipped" className="pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{ordersByStatus.shipped.map(order => <OrderCard key={order.id} order={order} />)}</TabsContent>
            <TabsContent value="delivered" className="pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{ordersByStatus.delivered.map(order => <OrderCard key={order.id} order={order} />)}</TabsContent>
            <TabsContent value="others" className="pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{ordersByStatus.others.map(order => <OrderCard key={order.id} order={order} />)}</TabsContent>
        </Tabs>
    );
}

// --- Returns Panel Component for Delivery ---
function ReturnsPanel({returns, isLoading, refreshData}: {returns: ReturnForDelivery[], isLoading: boolean, refreshData: () => void}) {
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const handleStatusChange = async (returnId: string, status: ReturnStatus) => {
        setActionLoading(returnId);
        try {
            const res = await fetch(`/api/returns/${returnId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (!res.ok) throw new Error("خطا در به‌روزرسانی وضعیت مرجوعی");
            await refreshData();
        } catch (error) {
            alert((error as Error).message);
        } finally {
            setActionLoading(null);
        }
    };

    if (isLoading) return <div className="text-center pt-10"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>;
    if (returns.length === 0) return <div className="text-center pt-10 text-gray-500"><RefreshCw className="mx-auto h-12 w-12" /><p className="mt-4">هیچ درخواست مرجوعی یافت نشد.</p></div>;

    const ReturnCard = ({ ret }: { ret: ReturnForDelivery }) => (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle className="text-base font-bold">{ret.order.user.shopName || ret.order.user.name}</CardTitle>
                    <Badge variant={getReturnStatusInfo(ret.status).variant}>{getReturnStatusInfo(ret.status).text}</Badge>
                </div>
                <CardDescription>
                   شماره: ...{ret.id.slice(-6)} | تاریخ: {new Date(ret.createdAt).toLocaleDateString('fa-IR')}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-sm space-y-2">
                    <p className="font-semibold">اقلام مرجوعی:</p>
                    <ul className="list-disc list-inside bg-gray-50 p-2 rounded-md">
                        {ret.items.map(item => <li key={item.id}>{item.orderItem.productName} (تعداد: {item.quantity})</li>)}
                    </ul>
                    {ret.reason && <p><span className="font-semibold">دلیل:</span> {ret.reason}</p>}
                </div>
                <div className="flex items-center gap-2 mt-4">
                    <Select onValueChange={(value) => handleStatusChange(ret.id, value as ReturnStatus)} defaultValue={ret.status} disabled={actionLoading === ret.id}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="REQUESTED">درخواست شده</SelectItem><SelectItem value="APPROVED">تایید شده</SelectItem><SelectItem value="REJECTED">رد شده</SelectItem></SelectContent></Select>
                    {actionLoading === ret.id && <Loader2 className="h-5 w-5 animate-spin" />}
                </div>
            </CardContent>
        </Card>
    );

    return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{returns.map((ret: ReturnForDelivery) => <ReturnCard key={ret.id} ret={ret} />)}</div>;
}

// --- Company Management Page ---
function CompanyManagementPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">مدیریت شرکت‌ها</h1>
            <Tabs defaultValue="suppliers" className="w-full">
                <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="suppliers">تولیدکنندگان</TabsTrigger><TabsTrigger value="distributors">پخش‌کنندگان</TabsTrigger></TabsList>
                <TabsContent value="suppliers" className="pt-4"><ManageCompanyType type="supplier" /></TabsContent>
                <TabsContent value="distributors" className="pt-4"><ManageCompanyType type="distributor" /></TabsContent>
            </Tabs>
        </div>
    );
}

function ManageCompanyType({ type }: { type: 'supplier' | 'distributor' }) {
    const [items, setItems] = useState<(Supplier | Distributor)[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newItem, setNewItem] = useState({ name: "", logo: "" });
    const [actionLoading, setActionLoading] = useState(false);
    
    const apiPath = useMemo(() => (type === 'supplier' ? '/api/suppliers' : '/api/distributors'), [type]);
    const title = useMemo(() => (type === 'supplier' ? 'تولیدکننده' : 'پخش‌کننده'), [type]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(apiPath);
            if (res.ok) setItems(await res.json());
        } catch (e) { console.error(`Failed to fetch ${type}s`, e); } 
        finally { setIsLoading(false); }
    };

    useEffect(() => { fetchData(); }, [apiPath]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            await fetch(apiPath, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newItem) });
            await fetchData();
            (document.getElementById(`add-${type}-close`) as HTMLButtonElement)?.click();
        } catch (e) { alert(`خطا در افزودن ${title}`); } 
        finally { setActionLoading(false); }
    };
    
    if (isLoading) return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Dialog onOpenChange={(open) => !open && setNewItem({ name: "", logo: "" })}>
                    <DialogTrigger asChild><Button><PlusCircle className="ml-2 h-4 w-4" />افزودن {title}</Button></DialogTrigger>
                    <DialogContent dir="rtl">
                        <DialogHeader><DialogTitle>افزودن {title} جدید</DialogTitle></DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                            <div><Label>نام {title}</Label><Input value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} required/></div>
                            <div><Label>لوگو (آدرس URL)</Label><Input value={newItem.logo} onChange={e => setNewItem({ ...newItem, logo: e.target.value })} /></div>
                            <DialogFooter>
                                <DialogClose asChild id={`add-${type}-close`}><Button type="button" variant="secondary">انصراف</Button></DialogClose>
                                <Button type="submit" disabled={actionLoading}>{actionLoading ? <Loader2 className="animate-spin" /> : "ذخیره"}</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
            <Card><CardContent className="pt-6"><Table><TableHeader><TableRow><TableHead className="w-[80px] text-right">لوگو</TableHead><TableHead className="text-right">نام</TableHead></TableRow></TableHeader><TableBody>{items.map(item => (<TableRow key={item.id}><TableCell className="text-right"><img src={item.logo || "/placeholder.svg"} alt={item.name} className="h-10 w-10 rounded-full object-contain bg-gray-100 p-1" /></TableCell><TableCell className="font-medium text-right">{item.name}</TableCell></TableRow>))}</TableBody></Table></CardContent></Card>
        </div>
    );
}

// --- Category Management Page ---
function CategoryManagementPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<any | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchCategories = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/categories');
            if (res.ok) setCategories(await res.json());
        } catch(e) { console.error(e); } 
        finally { setIsLoading(false); }
    };
    useEffect(() => { fetchCategories(); }, []);

    const handleOpenDialog = (category: any | null = null) => {
        setEditingCategory(category || { name: "", icon: "", image: "" });
        setIsDialogOpen(true);
    };

    const handleFormChange = (field: string, value: any) => {
        setEditingCategory((prev: any) => ({ ...prev, [field]: value }));
    };
    
    const handleImageUpload = async (file: File) => {
        if (!file || !editingCategory) return;
        setActionLoading(true);
        const formData = new FormData();
        formData.append("image", file);
        try {
            const res = await fetch(`https://api.imgbb.com/1/upload?key=${process.env.NEXT_PUBLIC_IMGBB_API_KEY}`, { method: "POST", body: formData });
            const data = await res.json();
            if (data.success) {
                handleFormChange('image', data.data.url);
            } else { alert("آپلود عکس موفق نبود."); }
        } catch (err) { alert("خطا در آپلود عکس"); } 
        finally { setActionLoading(false); }
    };
    
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!editingCategory) return;
        setActionLoading(true);
        const isEditing = !!editingCategory.id;
        const url = isEditing ? `/api/categories/${editingCategory.id}` : '/api/categories';
        const method = isEditing ? 'PUT' : 'POST';
        try {
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editingCategory) });
            if (!res.ok) throw new Error(await res.text());
            await fetchCategories();
            setIsDialogOpen(false);
        } catch (e) { alert(`خطا در ذخیره دسته‌بندی: ${e}`); } 
        finally { setActionLoading(false); }
    };
    
    const handleDelete = async (categoryId: string) => {
        setActionLoading(true);
        try {
            const res = await fetch(`/api/categories/${categoryId}`, { method: 'DELETE' });
            if (!res.ok) {
                const { error } = await res.json();
                throw new Error(error);
            }
            await fetchCategories();
        } catch (error) { alert(`خطا در حذف: ${error}`); } 
        finally { setActionLoading(false); }
    };

    if (isLoading) return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">مدیریت دسته‌بندی‌ها</h1>
                <Button onClick={() => handleOpenDialog()}><PlusCircle className="ml-2 h-4 w-4" />افزودن دسته‌بندی</Button>
            </div>
            <Card>
                <CardContent className="pt-6">
                    <Table>
                        <TableHeader><TableRow><TableHead className="w-[80px] text-right">تصویر</TableHead><TableHead className="w-[80px] text-right">آیکون</TableHead><TableHead className="text-right">نام</TableHead><TableHead className="text-center w-[120px]">عملیات</TableHead></TableRow></TableHeader>
                        <TableBody>{categories.map(c => (<TableRow key={c.id}>
                            <TableCell className="text-right"><img src={c.image || "/placeholder.svg"} alt={c.name} className="h-12 w-12 rounded-md object-cover" /></TableCell>
                            <TableCell className="text-right"><span className="text-2xl">{c.icon}</span></TableCell>
                            <TableCell className="font-medium text-right">{c.name}</TableCell>
                            <TableCell className="text-center">
                                <div className="flex justify-center gap-2">
                                    <Button size="sm" variant="outline" onClick={() => handleOpenDialog(c)}><Pencil className="h-4 w-4" /></Button>
                                    <Dialog>
                                        <DialogTrigger asChild><Button size="sm" variant="destructive"><Trash2 className="h-4 w-4" /></Button></DialogTrigger>
                                        <DialogContent dir="rtl">
                                            <DialogHeader><DialogTitle>حذف دسته‌بندی</DialogTitle></DialogHeader>
                                            <p>آیا مطمئن هستید که می‌خواهید دسته‌بندی "{c.name}" را حذف کنید؟ این عملیات غیرقابل بازگشت است.</p>
                                            <DialogFooter>
                                                <DialogClose asChild><Button variant="secondary">انصراف</Button></DialogClose>
                                                <Button variant="destructive" onClick={() => handleDelete(c.id)} disabled={actionLoading}>
                                                    {actionLoading ? <Loader2 className="animate-spin" /> : "تایید حذف"}
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </TableCell>
                        </TableRow>))}</TableBody>
                    </Table>
                </CardContent>
            </Card>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent dir="rtl">
                    <DialogHeader><DialogTitle>{editingCategory?.id ? 'ویرایش' : 'افزودن'} دسته‌بندی</DialogTitle></DialogHeader>
                    {editingCategory && <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                        <div><Label>نام دسته‌بندی</Label><Input value={editingCategory.name} onChange={e => handleFormChange('name', e.target.value)} required/></div>
                        <div><Label>آیکون (Emoji)</Label><Input value={editingCategory.icon || ""} onChange={e => handleFormChange('icon', e.target.value)} /></div>
                        <div>
                            <Label>تصویر</Label>
                            <div className="flex items-center gap-2">
                                <Input value={editingCategory.image || ''} onChange={e => handleFormChange('image', e.target.value)} placeholder="آدرس را وارد یا آپلود کنید"/>
                                <input type="file" accept="image/*" id="category-image-upload" className="hidden" onChange={(e: ChangeEvent<HTMLInputElement>) => e.target.files && handleImageUpload(e.target.files[0])}/>
                                <Button type="button" variant="outline" size="icon" onClick={() => document.getElementById('category-image-upload')?.click()} disabled={actionLoading}><Upload className="h-4 w-4"/></Button>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="secondary" onClick={() => setIsDialogOpen(false)}>انصراف</Button>
                            <Button type="submit" disabled={actionLoading}>{actionLoading ? <Loader2 className="animate-spin" /> : "ذخیره"}</Button>
                        </DialogFooter>
                    </form>}
                </DialogContent>
            </Dialog>
        </div>
    );
}

// --- Product Management Page ---
function ProductManagementPage() {
    const [products, setProducts] = useState<(Product & { category: Category, supplier: Supplier, distributor: Distributor })[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [distributors, setDistributors] = useState<Distributor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchAllData = async () => {
        setIsLoading(true);
        try {
            const [pRes, cRes, sRes, dRes] = await Promise.all([ fetch('/api/products'), fetch('/api/categories'), fetch('/api/suppliers'), fetch('/api/distributors') ]);
            setProducts(await pRes.json());
            setCategories(await cRes.json());
            setSuppliers(await sRes.json());
            setDistributors(await dRes.json());
        } catch (e) { console.error("Failed to fetch page data:", e); } 
        finally { setIsLoading(false); }
    };
    useEffect(() => { fetchAllData(); }, []);

    const handleOpenDialog = (product: any | null = null) => {
        setEditingProduct(product || { name: "", price: "", description: "", categoryId: "", image: "", available: true, discountPercentage: "0", unit: "عدد", stock: "", supplierId: "", distributorId: "" });
        setIsDialogOpen(true);
    };

    const handleFormChange = (field: string, value: any) => {
        setEditingProduct((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleImageUpload = async (file: File) => {
        if (!file) return;
        setActionLoading(true);
        const formData = new FormData();
        formData.append("image", file);
        try {
            const res = await fetch(`https://api.imgbb.com/1/upload?key=${process.env.NEXT_PUBLIC_IMGBB_API_KEY}`, { method: "POST", body: formData });
            const data = await res.json();
            if (data.success) {
                handleFormChange('image', data.data.url);
            } else { alert("آپلود عکس موفق نبود."); }
        } catch (err) { alert("خطا در آپلود عکس"); } 
        finally { setActionLoading(false); }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!editingProduct) return;
        setActionLoading(true);
        const isEditing = !!editingProduct.id;
        const url = isEditing ? `/api/products/${editingProduct.id}` : '/api/products';
        const method = isEditing ? 'PUT' : 'POST';
        const body = { ...editingProduct, price: parseFloat(editingProduct.price) || 0, stock: Number(editingProduct.stock) || 0, discountPercentage: Number(editingProduct.discountPercentage) || 0 };
        try {
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            if (!res.ok) throw new Error(await res.text());
            await fetchAllData();
            setIsDialogOpen(false);
        } catch (error) { alert(`خطا در ذخیره محصول: ${error}`); } 
        finally { setActionLoading(false); }
    };

    const handleDelete = async (productId: string) => {
        setActionLoading(true);
        try {
            await fetch(`/api/products/${productId}`, { method: 'DELETE' });
            await fetchAllData();
        } catch (error) { alert(`خطا در حذف محصول: ${error}`); } 
        finally { setActionLoading(false); }
    };
    
    if (isLoading) return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">مدیریت محصولات</h1>
                <Button onClick={() => handleOpenDialog()}><PlusCircle className="ml-2 h-4 w-4" />افزودن محصول</Button>
            </div>
            
            <Card>
                <CardContent className="pt-6">
                    <Table>
                        <TableHeader><TableRow><TableHead className="w-[60px] text-right">تصویر</TableHead><TableHead className="text-right">نام محصول</TableHead><TableHead className="text-right">تولیدکننده</TableHead><TableHead className="text-right">قیمت</TableHead><TableHead className="text-right">موجودی</TableHead><TableHead className="text-right">وضعیت</TableHead><TableHead className="text-center w-[120px]">عملیات</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {products.map(p => (
                                <TableRow key={p.id}>
                                    <TableCell className="text-right"><img src={p.image || "/placeholder.svg"} alt={p.name} className="h-12 w-12 rounded-md object-cover" /></TableCell>
                                    <TableCell className="font-medium text-right">{p.name}</TableCell>
                                    <TableCell className="text-right">{p.supplier.name}</TableCell>
                                    <TableCell className="text-right">{formatPrice(p.price)}</TableCell>
                                    <TableCell className="text-right">{p.stock.toLocaleString('fa-IR')} {p.unit}</TableCell>
                                    <TableCell className="text-right"><Badge variant={p.available ? 'default' : 'destructive'}>{p.available ? "موجود" : "ناموجود"}</Badge></TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex justify-center gap-2">
                                            <Button size="sm" variant="outline" onClick={() => handleOpenDialog(p)}><Pencil className="h-4 w-4" /></Button>
                                            <Dialog>
                                                <DialogTrigger asChild><Button size="sm" variant="destructive"><Trash2 className="h-4 w-4" /></Button></DialogTrigger>
                                                <DialogContent dir="rtl">
                                                    <DialogHeader><DialogTitle>حذف محصول</DialogTitle></DialogHeader>
                                                    <p>آیا مطمئن هستید که می‌خواهید محصول "{p.name}" را حذف کنید؟ این عملیات غیرقابل بازگشت است.</p>
                                                    <DialogFooter>
                                                        <DialogClose asChild><Button variant="secondary">انصراف</Button></DialogClose>
                                                        <Button variant="destructive" onClick={() => handleDelete(p.id)} disabled={actionLoading}>
                                                            {actionLoading ? <Loader2 className="animate-spin" /> : "تایید حذف"}
                                                        </Button>
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

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent dir="rtl" className="sm:max-w-lg">
                    <DialogHeader><DialogTitle>{editingProduct?.id ? 'ویرایش محصول' : 'افزودن محصول جدید'}</DialogTitle></DialogHeader>
                    {editingProduct && (
                        <form onSubmit={handleSubmit} className="space-y-4 pt-4 max-h-[80vh] overflow-y-auto p-4">
                             <div className="grid grid-cols-2 gap-4">
                                 <div><Label>نام محصول</Label><Input value={editingProduct.name} onChange={e => handleFormChange('name', e.target.value)} required/></div>
                                 <div><Label>قیمت (ریال)</Label><Input type="number" value={editingProduct.price} onChange={e => handleFormChange('price', e.target.value)} required /></div>
                                 <div><Label>دسته‌بندی</Label><Select value={editingProduct.categoryId} onValueChange={val => handleFormChange('categoryId', val)} required><SelectTrigger><SelectValue placeholder="انتخاب..." /></SelectTrigger><SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
                                 <div><Label>تولیدکننده</Label><Select value={editingProduct.supplierId} onValueChange={val => handleFormChange('supplierId', val)} required><SelectTrigger><SelectValue placeholder="انتخاب..." /></SelectTrigger><SelectContent>{suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
                                 <div><Label>پخش‌کننده</Label><Select value={editingProduct.distributorId} onValueChange={val => handleFormChange('distributorId', val)} required><SelectTrigger><SelectValue placeholder="انتخاب..." /></SelectTrigger><SelectContent>{distributors.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select></div>
                                 <div><Label>موجودی</Label><Input type="number" value={editingProduct.stock} onChange={e => handleFormChange('stock', e.target.value)} required /></div>
                                 <div><Label>تخفیف (٪)</Label><Input type="number" value={editingProduct.discountPercentage} onChange={e => handleFormChange('discountPercentage', e.target.value)} required /></div>
                                 <div><Label>واحد</Label><Input value={editingProduct.unit} onChange={e => handleFormChange('unit', e.target.value)} required /></div>
                             </div>
                            <div>
                                <Label>آدرس تصویر</Label>
                                <div className="flex items-center gap-2">
                                    <Input value={editingProduct.image || ''} onChange={e => handleFormChange('image', e.target.value)} placeholder="آدرس را وارد یا آپلود کنید"/>
                                    <input type="file" accept="image/*" id="product-image-upload" className="hidden" onChange={(e: ChangeEvent<HTMLInputElement>) => e.target.files && handleImageUpload(e.target.files[0])}/>
                                    <Button type="button" variant="outline" size="icon" onClick={() => document.getElementById('product-image-upload')?.click()} disabled={actionLoading}><Upload className="h-4 w-4"/></Button>
                                </div>
                            </div>
                            <div><Label>توضیحات</Label><Textarea value={editingProduct.description || ''} onChange={e => handleFormChange('description', e.target.value)} /></div>
                            <div className="flex items-center space-x-2"><Switch id="availability" checked={editingProduct.available} onCheckedChange={(c) => handleFormChange('available', c)} /><Label htmlFor="availability">موجود است</Label></div>
                            <DialogFooter className="pt-4">
                                <Button type="button" variant="secondary" onClick={() => setIsDialogOpen(false)}>انصراف</Button>
                                <Button type="submit" disabled={actionLoading}>{actionLoading ? <Loader2 className="animate-spin" /> : "ذخیره"}</Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}