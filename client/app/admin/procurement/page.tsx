// FILE: app/admin/procurement/page.tsx (CORRECTED)
"use client";

import { useState, useEffect, useMemo } from "react";
import type { Distributor, Product, Order, OrderItem, Supplier } from "@prisma/client";
import apiClient from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RestartLinear as Loader2, FilterLinear as Filter, CloseCircleLinear as X } from "@solar-icons/react-perf";

// --- Type Definitions ---
type ProductWithRelations = Product & { supplier: Supplier; distributor: Distributor };
type OrderItemWithProduct = OrderItem & { product: ProductWithRelations };
type OrderForProcurement = Order & { user: { name: string | null; shopName: string | null; }; items: OrderItemWithProduct[] };
interface ProcurementDetail { customerName: string; quantity: number; }
interface ProcurementItem extends ProductWithRelations {
    neededDate: string;
    neededQuantity: number;
    details: ProcurementDetail[];
}

export default function ProcurementPage() {
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
                const [ordersRes, distributorsRes, productsRes] = await Promise.all([
                    apiClient.get('/admin/orders'),
                    apiClient.get('/distributors'),
                    apiClient.get('/products?limit=1000') // Fetch all products for filter dropdown
                ]);

                const allOrders: OrderForProcurement[] = ordersRes.data;
                const distributors: Distributor[] = distributorsRes.data;
                const allProductsForFilter: Product[] = productsRes.data.products;

                setAllDistributors(distributors);
                setAllProducts(allProductsForFilter);

                const pendingOrders = allOrders.filter(o => o.status === 'PENDING' || o.status === 'SHIPPED');
                const productDemand: Record<string, { product: ProductWithRelations, details: ProcurementDetail[], neededDate: string }> = {};

                pendingOrders.forEach(order => {
                    const deliveryDateStr = new Date(order.deliveryDate).toISOString().split('T')[0];
                    order.items.forEach(item => {
                        const product = item.product;
                        if (product) {
                            const key = `${product.id}-${deliveryDateStr}`;
                            if (!productDemand[key]) {
                                productDemand[key] = { product, details: [], neededDate: deliveryDateStr };
                            }
                            productDemand[key].details.push({
                                customerName: order.user.shopName || order.user.name || 'نامشخص',
                                quantity: item.quantity
                            });
                        }
                    });
                });

                const procurementList = Object.values(productDemand).map(({ product, details, neededDate }) => ({
                    ...product,
                    neededDate: neededDate,
                    neededQuantity: details.reduce((sum, d) => sum + d.quantity, 0),
                    details
                }));

                setRawProcurementList(procurementList);
            } catch (error) {
                console.error("Failed to calculate procurement list:", error);
            } finally {
                setIsLoading(false);
            }
        };
        calculateProcurement();
    }, []);

    const filteredAndGroupedList = useMemo(() => {
        let items = rawProcurementList;
        if (filterDistributor !== 'all') items = items.filter(item => item.distributorId === filterDistributor);
        if (filterProduct !== 'all') items = items.filter(item => item.id === filterProduct);
        if (filterDate !== 'all') items = items.filter(item => item.neededDate === filterDate);

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

    const lastTenDates = useMemo(() => {
        const dates = Array.from(new Set(rawProcurementList.map(item => item.neededDate))).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
        return dates.slice(-10);
    }, [rawProcurementList]);

    const handleOpenDetails = (item: ProcurementItem) => {
        setSelectedItemDetails(item);
        setIsDetailsModalOpen(true);
    };

    if (isLoading) return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">تدارکات و سفارش از پخش‌کننده‌ها</h1>
            <p className="text-muted-foreground">لیست هوشمند محصولات مورد نیاز برای ارسال‌های پیش رو.</p>
            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5" /> فیلترها</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1.5"><Label>شرکت پخش</Label><Select value={filterDistributor} onValueChange={setFilterDistributor} dir="rtl"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">همه شرکت‌ها</SelectItem>{allDistributors.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select></div>
                    <div className="space-y-1.5"><Label>محصول</Label><Select value={filterProduct} onValueChange={setFilterProduct} dir="rtl"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">همه محصولات</SelectItem>{allProducts.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></div>
                    <div className="space-y-1.5"><Label>تاریخ نیاز</Label><Select value={filterDate} onValueChange={setFilterDate} dir="rtl"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">همه تاریخ‌ها</SelectItem>{lastTenDates.map(d => (<SelectItem key={d} value={d}>{new Date(d).toLocaleDateString('fa-IR')}</SelectItem>))}</SelectContent></Select></div>
                    <div className="flex items-end"><Button variant="outline" onClick={() => { setFilterDistributor('all'); setFilterProduct('all'); setFilterDate('all'); }} className="w-full"><X className="ml-2 h-4 w-4" />پاک کردن</Button></div>
                </CardContent>
            </Card>
            {filteredAndGroupedList.length === 0 ? (<Card><CardContent className="pt-6 text-center text-muted-foreground">موردی یافت نشد.</CardContent></Card>) : (filteredAndGroupedList.map(([distributorName, products]) => (<Card key={distributorName}><CardHeader><CardTitle>شرکت پخش: {distributorName}</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead className="text-right">تاریخ نیاز</TableHead><TableHead className="text-right">محصول</TableHead><TableHead className="text-right">تعداد</TableHead><TableHead className="text-center">عملیات</TableHead></TableRow></TableHeader><TableBody>{products.map(p => (<TableRow key={`${p.id}-${p.neededDate}`}><TableCell>{new Date(p.neededDate).toLocaleDateString('fa-IR')}</TableCell><TableCell>{p.name} <span className="text-muted-foreground text-xs">({p.supplier.name})</span></TableCell><TableCell>{p.neededQuantity.toLocaleString('fa-IR')} {p.unit}</TableCell><TableCell className="text-center"><Button variant="ghost" size="sm" onClick={() => handleOpenDetails(p)}>جزئیات</Button></TableCell></TableRow>))}</TableBody></Table></CardContent></Card>)))}
            <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}><DialogContent><DialogHeader><DialogTitle>جزئیات نیاز محصول</DialogTitle><DialogDescription>{selectedItemDetails?.name} برای تاریخ {new Date(selectedItemDetails?.neededDate || '').toLocaleDateString('fa-IR')}</DialogDescription></DialogHeader><div className="max-h-80 overflow-y-auto"><Table><TableHeader><TableRow><TableHead className="text-right">نام فروشگاه</TableHead><TableHead className="text-center">تعداد سفارش</TableHead></TableRow></TableHeader><TableBody>{selectedItemDetails?.details.map((detail, index) => (<TableRow key={index}><TableCell>{detail.customerName}</TableCell><TableCell className="text-center">{detail.quantity}</TableCell></TableRow>))}</TableBody></Table></div><DialogFooter><Button onClick={() => setIsDetailsModalOpen(false)}>بستن</Button></DialogFooter></DialogContent></Dialog>
        </div>
    );
}
