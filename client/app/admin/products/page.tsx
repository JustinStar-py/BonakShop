// FILE: app/admin/products/page.tsx (FINAL with Status Filter, Search & Pagination)
"use client";

import { useState, useEffect, useMemo, FormEvent, ChangeEvent, useCallback } from "react";
import type { Category, Product, Supplier, Distributor } from "@prisma/client";
import apiClient from "@/lib/apiClient";
import useDebounce from "@/hooks/useDebounce";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { RestartLinear as Loader2, Pen2Linear as Pencil, AddCircleLinear as PlusCircle, TrashBinMinimalisticLinear as Trash2, UploadLinear as Upload, StarLinear as Star, MagniferLinear as Search, AltArrowLeftLinear as ChevronLeft, AltArrowRightLinear as ChevronRight, DollarLinear as DollarSign, TagLinear as Percent } from "@solar-icons/react-perf";
import { Badge } from "@/components/ui/badge";
import { formatToToman } from "@/utils/currencyFormatter";
import Image from "next/image";

type ProductWithRelations = Product & { category: Category; supplier: Supplier; distributor: Distributor };
type EntityType = "category" | "supplier" | "distributor";
type BulkDirection = "increase" | "decrease";
type BulkReductionType = "percentage" | "fixed";

type EditableProduct = {
    id?: string;
    name: string;
    price: string | number;
    description?: string | null;
    categoryId: string;
    image?: string | null;
    available: boolean;
    discountPercentage: string | number;
    unit: string;
    stock: string | number;
    supplierId: string;
    distributorId: string;
    isFeatured: boolean;
    consumerPrice?: string | number | null;
};

const toNumber = (value: string | number | null | undefined | boolean) => {
    if (typeof value === 'boolean') return 0;
    return Number(value ?? 0);
};

const isBulkDirection = (value: string): value is BulkDirection =>
    value === "increase" || value === "decrease";
const isBulkReductionType = (value: string): value is BulkReductionType =>
    value === "percentage" || value === "fixed";

const getErrorMessage = (err: unknown) => {
    if (typeof err === "object" && err && "response" in err) {
        const response = (err as { response?: { data?: { error?: string } } }).response;
        return response?.data?.error;
    }
    if (err instanceof Error) {
        return err.message;
    }
    return "خطای نامشخص";
};

export default function ProductManagementPage() {
    const [products, setProducts] = useState<ProductWithRelations[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [distributors, setDistributors] = useState<Distributor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [totalProducts, setTotalProducts] = useState(0);

    // Dialog states
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<EditableProduct | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; productId: string | null; productName: string | null; }>({ isOpen: false, productId: null, productName: null });
    const [addEntity, setAddEntity] = useState<{ type: EntityType | null, isOpen: boolean }>({ type: null, isOpen: false });
    const [newEntityName, setNewEntityName] = useState("");
    const [priceInToman, setPriceInToman] = useState('');
    const [consumerPriceInToman, setConsumerPriceInToman] = useState('');
    const [discountedPriceInToman, setDiscountedPriceInToman] = useState('');
    const [isBulkUpdateDialogOpen, setIsBulkUpdateDialogOpen] = useState(false);
    const [bulkReductionType, setBulkReductionType] = useState<BulkReductionType>("percentage");
    const [bulkReductionValue, setBulkReductionValue] = useState('');
    const [bulkDirection, setBulkDirection] = useState<BulkDirection>("decrease");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [supplierFilter, setSupplierFilter] = useState<string>("all");
    const [distributorFilter, setDistributorFilter] = useState<string>("all");
    const [categorySearch, setCategorySearch] = useState("");
    const [supplierSearch, setSupplierSearch] = useState("");
    const [distributorSearch, setDistributorSearch] = useState("");

    const stopSelectTypeahead = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // Prevent Radix Select from interpreting typed keys as typeahead selection
        e.stopPropagation();
    };

    // Search, Filter, and Pagination states
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const discountedPrice = useMemo(() => {
        if (!editingProduct?.price || Number.isNaN(Number(editingProduct.price))) return 0;
        const discount = toNumber(editingProduct.discountPercentage);
        return toNumber(editingProduct.price) * (1 - discount / 100);
    }, [editingProduct?.price, editingProduct?.discountPercentage]);

    useEffect(() => {
        if (editingProduct) {
            setPriceInToman(formatToToman(toNumber(editingProduct.price)));
            setConsumerPriceInToman(formatToToman(toNumber(editingProduct.consumerPrice)));
            setDiscountedPriceInToman(formatToToman(discountedPrice));
        }
    }, [editingProduct, discountedPrice]);

    // Fetch function now handles pagination, search and status filter
    const fetchProducts = useCallback(async (
        page: number,
        search: string,
        status: string,
        categoryId?: string,
        supplierId?: string,
        distributorId?: string
    ) => {
        const resolvedCategory = categoryId && categoryId !== "all" ? categoryId : "";
        const resolvedSupplier = supplierId && supplierId !== "all" ? supplierId : "";
        const resolvedDistributor = distributorId && distributorId !== "all" ? distributorId : "";
        setIsLoading(true);
        try {
            const res = await apiClient.get(
                `/products?page=${page}&limit=15&search=${search}&status=${status}&categoryId=${resolvedCategory}&supplierId=${resolvedSupplier}&distributorId=${resolvedDistributor}`
            );
            const nextTotalPages = res.data.totalPages || 1;
            const nextPage = Math.min(Math.max(res.data.currentPage ?? page, 1), nextTotalPages);
            setProducts(res.data.products || []);
            setTotalPages(nextTotalPages);
            setCurrentPage(nextPage);
            setTotalProducts(res.data.totalProducts || 0);
        } catch (e) {
            console.error("Failed to fetch products:", e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchDropdownData = useCallback(async () => {
        try {
            const [cRes, sRes, dRes] = await Promise.all([
                apiClient.get('/categories'),
                apiClient.get('/suppliers'),
                apiClient.get('/distributors')
            ]);
            setCategories(cRes.data || []);
            setSuppliers(sRes.data || []);
            setDistributors(dRes.data || []);
        } catch (e) { console.error("Failed to fetch dropdown data:", e); }
    }, []);

    useEffect(() => {
        fetchDropdownData();
    }, [fetchDropdownData]);

    useEffect(() => {
        fetchProducts(
            currentPage,
            debouncedSearchTerm,
            statusFilter,
            categoryFilter || undefined,
            supplierFilter || undefined,
            distributorFilter || undefined
        );
    }, [currentPage, debouncedSearchTerm, statusFilter, categoryFilter, supplierFilter, distributorFilter, fetchProducts]);


    const handleOpenDialog = (product: ProductWithRelations | null = null) => {
        if (product) {
            setEditingProduct({
                id: product.id,
                name: product.name,
                price: product.price,
                description: product.description,
                categoryId: product.categoryId,
                image: product.image,
                available: product.available,
                discountPercentage: product.discountPercentage,
                unit: product.unit,
                stock: product.stock,
                supplierId: product.supplierId,
                distributorId: product.distributorId,
                isFeatured: product.isFeatured,
                consumerPrice: product.consumerPrice,
            });
        } else {
            setEditingProduct({
                name: "",
                price: "",
                description: "",
                categoryId: "",
                image: "",
                available: true,
                discountPercentage: "0",
                unit: "عدد",
                stock: "",
                supplierId: "",
                distributorId: "",
                isFeatured: false,
                consumerPrice: "",
            });
        }
        setIsDialogOpen(true);
    };

    const handleFormChange = (field: keyof EditableProduct, value: string | number | boolean) => {
        setEditingProduct((prev) => (prev ? { ...prev, [field]: value } : prev));

        if (field === 'price') {
            setPriceInToman(formatToToman(toNumber(value)));
        } else if (field === 'consumerPrice') {
            setConsumerPriceInToman(formatToToman(toNumber(value)));
        } else if (field === 'discountPercentage') {
            const price = toNumber(editingProduct?.price);
            const discount = toNumber(value);
            const newDiscountedPrice = price * (1 - discount / 100);
            setDiscountedPriceInToman(formatToToman(newDiscountedPrice));
        }
    };

    const handleSelectChange = (field: EntityType, value: string) => {
        const addValueMap = { 'category': 'add-new-category', 'supplier': 'add-new-supplier', 'distributor': 'add-new-distributor' };
        if (value === addValueMap[field]) { setAddEntity({ type: field, isOpen: true }); }
        else { handleFormChange(`${field}Id` as keyof EditableProduct, value); }
    };

    const handleAddNewEntity = async () => {
        if (!addEntity.type || !newEntityName) return;
        setActionLoading(true);
        const apiMap = {
            'category': { path: '/categories', key: 'categoryId' }, 'supplier': { path: '/suppliers', key: 'supplierId' }, 'distributor': { path: '/distributors', key: 'distributorId' }
        };
        const { path, key } = apiMap[addEntity.type];
        try {
            const res = await apiClient.post<{ id: string }>(path, { name: newEntityName });
            await fetchDropdownData();
            handleFormChange(key as keyof EditableProduct, res.data.id);
            setAddEntity({ type: null, isOpen: false }); setNewEntityName("");
        } catch (error) { alert(`خطا در افزودن آیتم جدید: ${getErrorMessage(error)}`); }
        finally { setActionLoading(false); }
    };

    const handleImageUpload = async (file: File) => {
        if (!file) return;
        setActionLoading(true);
        const formData = new FormData();
        formData.append("image", file);
        try {
            const res = await fetch(`https://api.imgbb.com/1/upload?key=4b2ba5e2eec4847988305b536b6f4a50`, { method: "POST", body: formData });
            const data = await res.json();
            if (data.success) { handleFormChange('image', data.data.url); }
            else { alert("آپلود عکس موفق نبود."); }
        } catch { alert("خطا در آپلود عکس"); }
        finally { setActionLoading(false); }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!editingProduct) return;
        setActionLoading(true);
        const isEditing = !!editingProduct.id;
        const url = isEditing ? `/products/${editingProduct.id}` : '/products';
        const method = isEditing ? 'PUT' : 'POST';
        const body: EditableProduct = {
            ...editingProduct,
            price: toNumber(editingProduct.price),
            stock: toNumber(editingProduct.stock),
            discountPercentage: toNumber(editingProduct.discountPercentage),
            isFeatured: Boolean(editingProduct.isFeatured),
            consumerPrice: editingProduct.consumerPrice ? toNumber(editingProduct.consumerPrice) : null
        };
        try {
            await apiClient({ url, method, data: body });
            await fetchProducts(
                currentPage,
                debouncedSearchTerm,
                statusFilter,
                categoryFilter || undefined,
                supplierFilter || undefined,
                distributorFilter || undefined
            );
            setIsDialogOpen(false);
        } catch (error) { alert(`خطا در ذخیره محصول: ${getErrorMessage(error)}`); }
        finally { setActionLoading(false); }
    };

    const handleDelete = async (productId: string | null) => {
        if (!productId) return;
        setActionLoading(true);
        try {
            await apiClient.delete(`/products/${productId}`);
            await fetchProducts(currentPage, debouncedSearchTerm, statusFilter);
            setDeleteDialog({ isOpen: false, productId: null, productName: null });
        } catch (error) { alert(`خطا در حذف محصول: ${getErrorMessage(error)}`); }
        finally { setActionLoading(false); }
    };

    const handleBulkPriceUpdate = async () => {
        if (!bulkReductionValue) return;
        setActionLoading(true);
        try {
            await apiClient.post('/products/bulk-update-price', {
                reductionType: bulkReductionType,
                reductionValue: parseFloat(bulkReductionValue),
                direction: bulkDirection,
                categoryId: categoryFilter !== "all" ? categoryFilter : undefined,
                supplierId: supplierFilter !== "all" ? supplierFilter : undefined,
                distributorId: distributorFilter !== "all" ? distributorFilter : undefined,
                status: statusFilter,
                searchTerm: debouncedSearchTerm,
            });
            await fetchProducts(currentPage, debouncedSearchTerm, statusFilter);
            setIsBulkUpdateDialogOpen(false);
            setBulkReductionValue('');
        } catch (error) {
            alert(`خطا در بروزرسانی قیمت‌ها: ${getErrorMessage(error)}`);
        } finally {
            setActionLoading(false);
        }
    };

    const openBulkDialog = (preset?: { direction?: BulkDirection; type?: BulkReductionType }) => {
        if (preset?.direction) setBulkDirection(preset.direction);
        if (preset?.type) setBulkReductionType(preset.type);
        setIsBulkUpdateDialogOpen(true);
    };

    const handleBulkDelete = async () => {
        const ok = window.confirm("آیا از حذف گروهی محصولات (بر اساس فیلتر فعلی) مطمئن هستید؟ این عملیات قابل بازگشت نیست.");
        if (!ok) return;
        setActionLoading(true);
        try {
            await apiClient.post('/products/bulk-delete', {
                categoryId: categoryFilter !== "all" ? categoryFilter : undefined,
                supplierId: supplierFilter !== "all" ? supplierFilter : undefined,
                distributorId: distributorFilter !== "all" ? distributorFilter : undefined,
                status: statusFilter,
                searchTerm: debouncedSearchTerm,
            });
            await fetchProducts(currentPage, debouncedSearchTerm, statusFilter);
        } catch (error) {
            alert(`خطا در حذف گروهی: ${getErrorMessage(error)}`);
        } finally {
            setActionLoading(false);
        }
    };


    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">مدیریت محصولات</h1>
                <div className="flex flex-wrap gap-2 justify-end">
                    <Button onClick={() => handleOpenDialog()}><PlusCircle className="ml-2 h-4 w-4" />افزودن محصول</Button>
                    <Button onClick={() => openBulkDialog()} variant="outline" className="border-green-500 text-green-700 hover:bg-green-50"><DollarSign className="ml-2 h-4 w-4" />تغییر قیمت گروهی</Button>
                    <Button onClick={() => openBulkDialog({ direction: 'decrease', type: 'percentage' })} variant="secondary" className="bg-amber-50 text-amber-700 hover:bg-amber-100"><Percent className="ml-2 h-4 w-4" />اعمال تخفیف گروهی</Button>
                    <Button onClick={handleBulkDelete} variant="destructive" disabled={actionLoading}><Trash2 className="ml-2 h-4 w-4" />حذف گروهی</Button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-grow">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input
                        placeholder="جستجو در محصولات..."
                        className="pr-10"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                    />
                </div>
                <Select value={statusFilter} onValueChange={(value) => {
                    setStatusFilter(value);
                    setCurrentPage(1);
                }}>
                    <SelectTrigger className="w-full md:w-[180px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                        <SelectItem value="available">موجود</SelectItem>
                        <SelectItem value="unavailable">ناموجود</SelectItem>
                        <SelectItem value="featured">ویژه</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select value={categoryFilter} onValueChange={(val) => { setCategoryFilter(val); setCurrentPage(1); setCategorySearch(""); }}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="همه دسته‌بندی‌ها" />
                    </SelectTrigger>
                    <SelectContent>
                        <div className="px-3 py-2">
                            <Input
                                placeholder="جستجوی دسته‌بندی..."
                                value={categorySearch}
                                onChange={(e) => setCategorySearch(e.target.value)}
                                onKeyDown={stopSelectTypeahead}
                            />
                        </div>
                        <SelectItem value="all">همه دسته‌بندی‌ها</SelectItem>
                        {categories
                            .filter((c) => c.name.toLowerCase().includes(categorySearch.toLowerCase()))
                            .map((c) => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                    </SelectContent>
                </Select>

                <Select value={supplierFilter} onValueChange={(val) => { setSupplierFilter(val); setCurrentPage(1); setSupplierSearch(""); }}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="همه تولیدکننده‌ها" />
                    </SelectTrigger>
                    <SelectContent>
                        <div className="px-3 py-2">
                            <Input
                                placeholder="جستجوی تولیدکننده..."
                                value={supplierSearch}
                                onChange={(e) => setSupplierSearch(e.target.value)}
                                onKeyDown={stopSelectTypeahead}
                            />
                        </div>
                        <SelectItem value="all">همه تولیدکننده‌ها</SelectItem>
                        {suppliers
                            .filter((s) => s.name.toLowerCase().includes(supplierSearch.toLowerCase()))
                            .map((s) => (
                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                    </SelectContent>
                </Select>

                <Select value={distributorFilter} onValueChange={(val) => { setDistributorFilter(val); setCurrentPage(1); setDistributorSearch(""); }}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="همه پخش‌کننده‌ها" />
                    </SelectTrigger>
                    <SelectContent>
                        <div className="px-3 py-2">
                            <Input
                                placeholder="جستجوی پخش‌کننده..."
                                value={distributorSearch}
                                onChange={(e) => setDistributorSearch(e.target.value)}
                                onKeyDown={stopSelectTypeahead}
                            />
                        </div>
                        <SelectItem value="all">همه پخش‌کننده‌ها</SelectItem>
                        {distributors
                            .filter((d) => d.name.toLowerCase().includes(distributorSearch.toLowerCase()))
                            .map((d) => (
                                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                            ))}
                    </SelectContent>
                </Select>
            </div>

            <Card>
                <CardContent className="pt-6">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : (
                        <Table>
                            <TableHeader><TableRow>
                                <TableHead className="w-[60px] text-right">تصویر</TableHead>
                                <TableHead className="text-right">نام محصول</TableHead>
                                <TableHead className="text-right">موجودی</TableHead>
                                <TableHead className="text-right">وضعیت</TableHead>
                                <TableHead className="text-center w-[120px]">عملیات</TableHead>
                            </TableRow></TableHeader>
                            <TableBody>
                                {products.map(p => (
                                    <TableRow key={p.id}>
                                        <TableCell className="text-right">
                                            <Image
                                                src={p.image || "/placeholder.svg"}
                                                alt={p.name}
                                                width={48}
                                                height={48}
                                                sizes="48px"
                                                className="rounded-md object-cover"
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium text-right flex items-center gap-2">
                                            {p.name}
                                            {p.isFeatured && <Star className="h-4 w-4 text-yellow-500 fill-yellow-400" />}
                                        </TableCell>
                                        <TableCell className="text-right">{p.stock.toLocaleString('fa-IR')} {p.unit}</TableCell>
                                        <TableCell className="text-right"><Badge variant={p.available ? 'default' : 'destructive'}>{p.available ? "موجود" : "ناموجود"}</Badge></TableCell>
                                        <TableCell className="text-center"><div className="flex justify-center gap-2">
                                            <Button size="sm" variant="outline" onClick={() => handleOpenDialog(p)}><Pencil className="h-4 w-4" /></Button>
                                            <Button size="sm" variant="destructive" onClick={() => setDeleteDialog({ isOpen: true, productId: p.id, productName: p.name })}><Trash2 className="h-4 w-4" /></Button>
                                        </div></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4">
                    <Button variant="outline" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>
                        <ChevronRight className="h-4 w-4" /> قبلی
                    </Button>
                    <span className="text-sm font-medium">
                        صفحه {currentPage.toLocaleString('fa-IR')} از {totalPages.toLocaleString('fa-IR')}
                    </span>
                    <Button variant="outline" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>
                        بعدی <ChevronLeft className="h-4 w-4" />
                    </Button>
                </div>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent dir="rtl" className="sm:max-w-lg">
                    <DialogHeader><DialogTitle>{editingProduct?.id ? 'ویرایش محصول' : 'افزودن محصول جدید'}</DialogTitle></DialogHeader>
                    {editingProduct && (
                        <form onSubmit={handleSubmit} className="space-y-4 pt-4 max-h-[80vh] overflow-y-auto p-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div><Label>نام محصول</Label><Input value={editingProduct.name} onChange={e => handleFormChange('name', e.target.value)} required /></div>
                                <div>
                                    <Label>قیمت فروش (تومان)</Label>
                                    <Input type="number" value={editingProduct.price} onChange={e => handleFormChange('price', e.target.value)} required />
                                    <p className="text-xs text-gray-500 mt-1">{priceInToman}</p>
                                </div>
                                <div>
                                    <Label>قیمت مصرف‌کننده (تومان)</Label>
                                    <Input type="number" value={editingProduct.consumerPrice || ''} onChange={e => handleFormChange('consumerPrice', e.target.value)} />
                                    <p className="text-xs text-gray-500 mt-1">{consumerPriceInToman}</p>
                                </div>
                                <div>
                                    <Label>تخفیف (٪)</Label>
                                    <Input type="number" value={editingProduct.discountPercentage} onChange={e => handleFormChange('discountPercentage', e.target.value)} />
                                    <p className="text-xs text-green-600 mt-1">قیمت بعد از تخفیف: {discountedPriceInToman}</p>
                                </div>
                                <div><Label>دسته‌بندی</Label><Select value={editingProduct.categoryId} onValueChange={val => handleSelectChange('category', val)} required><SelectTrigger><SelectValue placeholder="انتخاب..." /></SelectTrigger><SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}<SelectItem value="add-new-category" className="text-blue-500 font-bold">افزودن دسته‌بندی جدید...</SelectItem></SelectContent></Select></div>
                                <div><Label>تولیدکننده</Label><Select value={editingProduct.supplierId} onValueChange={val => handleSelectChange('supplier', val)} required><SelectTrigger><SelectValue placeholder="انتخاب..." /></SelectTrigger><SelectContent>{suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}<SelectItem value="add-new-supplier" className="text-blue-500 font-bold">افزودن تولیدکننده جدید...</SelectItem></SelectContent></Select></div>
                                <div><Label>پخش‌کننده</Label><Select value={editingProduct.distributorId} onValueChange={val => handleSelectChange('distributor', val)} required><SelectTrigger><SelectValue placeholder="انتخاب..." /></SelectTrigger><SelectContent>{distributors.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}<SelectItem value="add-new-distributor" className="text-blue-500 font-bold">افزودن پخش‌کننده جدید...</SelectItem></SelectContent></Select></div>
                                <div><Label>موجودی</Label><Input type="number" value={editingProduct.stock} onChange={e => handleFormChange('stock', e.target.value)} required /></div>
                                <div><Label>واحد</Label><Input value={editingProduct.unit} onChange={e => handleFormChange('unit', e.target.value)} required /></div>
                            </div>
                            <div><Label>آدرس تصویر</Label><div className="flex items-center gap-2"><Input value={editingProduct.image || ''} onChange={e => handleFormChange('image', e.target.value)} placeholder="آدرس را وارد یا آپلود کنید" /><input type="file" accept="image/*" id="product-image-upload" className="hidden" onChange={(e: ChangeEvent<HTMLInputElement>) => e.target.files && handleImageUpload(e.target.files[0])} /><Button type="button" variant="outline" size="icon" onClick={() => document.getElementById('product-image-upload')?.click()} disabled={actionLoading}><Upload className="h-4 w-4" /></Button></div></div>
                            <div><Label>توضیحات</Label><Textarea value={editingProduct.description || ''} onChange={e => handleFormChange('description', e.target.value)} /></div>
                            <div className="flex items-center justify-between pt-2">
                                <div className="flex items-center space-x-2 space-x-reverse"><Switch id="availability" checked={editingProduct.available} onCheckedChange={(c) => handleFormChange('available', c)} /><Label htmlFor="availability">موجود است</Label></div>
                                <div className="flex items-center space-x-2 space-x-reverse"><Switch id="isFeatured" checked={editingProduct.isFeatured} onCheckedChange={(c) => handleFormChange('isFeatured', c)} /><Label htmlFor="isFeatured">محصول ویژه</Label></div>
                            </div>
                            <DialogFooter className="pt-4"><Button type="button" variant="secondary" onClick={() => setIsDialogOpen(false)}>انصراف</Button><Button type="submit" disabled={actionLoading}>{actionLoading ? <Loader2 className="animate-spin" /> : "ذخیره"}</Button></DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={deleteDialog.isOpen} onOpenChange={() => setDeleteDialog({ isOpen: false, productId: null, productName: null })}>
                <DialogContent dir="rtl">
                    <DialogHeader><DialogTitle>حذف محصول</DialogTitle></DialogHeader>
                    <p>آیا مطمئن هستید که می‌خواهید محصول "{deleteDialog.productName}" را حذف کنید؟ این عملیات غیرقابل بازگشت است.</p>
                    <DialogFooter>
                        <Button variant="secondary" onClick={() => setDeleteDialog({ isOpen: false, productId: null, productName: null })}>انصراف</Button>
                        <Button variant="destructive" onClick={() => handleDelete(deleteDialog.productId)} disabled={actionLoading}>{actionLoading ? <Loader2 className="animate-spin" /> : "تایید حذف"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={addEntity.isOpen} onOpenChange={() => setAddEntity({ type: null, isOpen: false })}>
                <DialogContent dir="rtl" className="sm:max-w-md z-[60]">
                    <DialogHeader><DialogTitle>افزودن {addEntity.type === 'category' && ' دسته‌بندی جدید'}{addEntity.type === 'supplier' && ' تولیدکننده جدید'}{addEntity.type === 'distributor' && ' پخش‌کننده جدید'}</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4"><Label>نام</Label><Input value={newEntityName} onChange={e => setNewEntityName(e.target.value)} required /></div>
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="secondary">انصراف</Button></DialogClose>
                        <Button onClick={handleAddNewEntity} disabled={actionLoading || !newEntityName}>{actionLoading ? <Loader2 className="animate-spin" /> : "ذخیره"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isBulkUpdateDialogOpen} onOpenChange={setIsBulkUpdateDialogOpen}>
                <DialogContent dir="rtl">
                    <DialogHeader>
                        <DialogTitle>تغییر قیمت گروهی</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <p>
                            این عملیات قیمت
                            <span className="font-bold px-1">{(totalProducts || products.length).toLocaleString('fa-IR')}</span>
                            محصول مطابق فیلترهای فعلی (جستجو، وضعیت، دسته‌بندی، تولیدکننده، پخش‌کننده) را یکجا به‌روز می‌کند.
                        </p>
                        <div className="flex items-center space-x-2 space-x-reverse">
                            <Label>جهت تغییر:</Label>
                            <Select
                                value={bulkDirection}
                                onValueChange={(value) =>
                                    setBulkDirection(isBulkDirection(value) ? value : "decrease")
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="decrease">کاهش</SelectItem>
                                    <SelectItem value="increase">افزایش</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center space-x-2 space-x-reverse">
                            <Label>نوع تغییر:</Label>
                            <Select
                                value={bulkReductionType}
                                onValueChange={(value) =>
                                    setBulkReductionType(isBulkReductionType(value) ? value : "percentage")
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="percentage">درصدی (٪)</SelectItem>
                                    <SelectItem value="fixed">مقدار ثابت (تومان)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>مقدار تغییر:</Label>
                            <Input
                                type="number"
                                value={bulkReductionValue}
                                onChange={e => setBulkReductionValue(e.target.value)}
                                placeholder={bulkReductionType === 'percentage' ? "مثلاً ۱۰ برای ۱۰٪" : "مثلاً ۵۰۰۰ برای ۵ هزار تومان"}
                            />
                            <p className="text-[11px] text-gray-500 mt-1">
                                {bulkReductionType === 'percentage'
                                    ? "درصد افزایش/کاهش روی قیمت فعلی هر محصول اعمال می‌شود."
                                    : "مقدار ثابت به تومان روی قیمت فعلی هر محصول اعمال می‌شود."}
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="secondary" onClick={() => setIsBulkUpdateDialogOpen(false)}>انصراف</Button>
                        <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleBulkPriceUpdate} disabled={actionLoading || !bulkReductionValue}>
                            {actionLoading ? <Loader2 className="animate-spin" /> : "تایید و اجرا"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
