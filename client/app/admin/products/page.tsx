// FILE: app/admin/products/page.tsx (FIXED)
"use client";

import { useState, useEffect, useMemo, FormEvent, ChangeEvent } from "react";
import type { Category, Product, Supplier, Distributor } from "@prisma/client";
import apiClient from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Pencil, PlusCircle, Trash2, Upload, Star } from "lucide-react"; // <-- Star icon added
import { Badge } from "@/components/ui/badge";

function formatPrice(price: number) {
    if (typeof price !== 'number' || isNaN(price)) return "۰ ریال";
    return price.toLocaleString('fa-IR') + " ریال";
}

type ProductWithRelations = Product & { category: Category, supplier: Supplier, distributor: Distributor };

export default function ProductManagementPage() {
  const [products, setProducts] = useState<ProductWithRelations[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; productId: string | null; productName: string | null }>({ isOpen: false, productId: null, productName: null });

  const discountedPrice = useMemo(() => {
    if (!editingProduct?.price || isNaN(Number(editingProduct.price))) return 0;
    const discount = Number(editingProduct.discountPercentage) || 0;
    return Number(editingProduct.price) * (1 - discount / 100);
  }, [editingProduct?.price, editingProduct?.discountPercentage]);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [pRes, cRes, sRes, dRes] = await Promise.all([
        apiClient.get('/products'),
        apiClient.get('/categories'),
        apiClient.get('/suppliers'),
        apiClient.get('/distributors')
      ]);
      setProducts(pRes.data.products || []);
      setCategories(cRes.data || []);
      setSuppliers(sRes.data || []);
      setDistributors(dRes.data || []);
    } catch (e) { console.error("Failed to fetch page data:", e); } 
    finally { setIsLoading(false); }
  };
  useEffect(() => { fetchAllData(); }, []);

  const handleOpenDialog = (product: any | null = null) => {
    setEditingProduct(product || {
      name: "", price: "", description: "", categoryId: "", image: "",
      available: true, discountPercentage: "0", unit: "عدد", stock: "",
      supplierId: "", distributorId: "", isFeatured: false // <-- CHANGE: Initial value for new product
    });
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
    const body = {
      ...editingProduct,
      price: parseFloat(editingProduct.price) || 0,
      stock: Number(editingProduct.stock) || 0,
      discountPercentage: Number(editingProduct.discountPercentage) || 0,
      isFeatured: Boolean(editingProduct.isFeatured) // <-- CHANGE: Ensure it's a boolean
    };
    try {
      await apiClient({ url, method, data: body });
      await fetchAllData();
      setIsDialogOpen(false);
    } catch (error) { alert(`خطا در ذخیره محصول: ${error}`); }
    finally { setActionLoading(false); }
  };

  const handleDelete = async (productId: string | null) => {
    if (!productId) return;
    setActionLoading(true);
    try {
      await apiClient.delete(`/products/${productId}`);
      await fetchAllData();
      setDeleteDialog({ isOpen: false, productId: null, productName: null });
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
                  <TableCell className="text-right"><img src={p.image || "/placeholder.svg"} alt={p.name} className="h-12 w-12 rounded-md object-cover" /></TableCell>
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
        </CardContent>
      </Card>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent dir="rtl" className="sm:max-w-lg"><DialogHeader><DialogTitle>{editingProduct?.id ? 'ویرایش محصول' : 'افزودن محصول جدید'}</DialogTitle></DialogHeader>
          {editingProduct && (
            <form onSubmit={handleSubmit} className="space-y-4 pt-4 max-h-[80vh] overflow-y-auto p-4">
              {/* ... Other form fields ... */}
              <div className="grid grid-cols-2 gap-4">
                <div><Label>نام محصول</Label><Input value={editingProduct.name} onChange={e => handleFormChange('name', e.target.value)} required /></div>
                <div><Label>قیمت (ریال)</Label><Input type="number" value={editingProduct.price} onChange={e => handleFormChange('price', e.target.value)} required /></div>
                <div><Label>تخفیف (٪)</Label><Input type="number" value={editingProduct.discountPercentage} onChange={e => handleFormChange('discountPercentage', e.target.value)} /><p className="text-xs text-green-600 mt-2">قیمت بعد از تخفیف: {discountedPrice.toLocaleString('fa-IR')} ریال</p></div>
                <div><Label>دسته‌بندی</Label><Select value={editingProduct.categoryId} onValueChange={val => handleFormChange('categoryId', val)} required><SelectTrigger><SelectValue placeholder="انتخاب..." /></SelectTrigger><SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>تولیدکننده</Label><Select value={editingProduct.supplierId} onValueChange={val => handleFormChange('supplierId', val)} required><SelectTrigger><SelectValue placeholder="انتخاب..." /></SelectTrigger><SelectContent>{suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>پخش‌کننده</Label><Select value={editingProduct.distributorId} onValueChange={val => handleFormChange('distributorId', val)} required><SelectTrigger><SelectValue placeholder="انتخاب..." /></SelectTrigger><SelectContent>{distributors.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>موجودی</Label><Input type="number" value={editingProduct.stock} onChange={e => handleFormChange('stock', e.target.value)} required /></div>
                <div><Label>واحد</Label><Input value={editingProduct.unit} onChange={e => handleFormChange('unit', e.target.value)} required /></div>
              </div>
              <div><Label>آدرس تصویر</Label><div className="flex items-center gap-2"><Input value={editingProduct.image || ''} onChange={e => handleFormChange('image', e.target.value)} placeholder="آدرس را وارد یا آپلود کنید" /><input type="file" accept="image/*" id="product-image-upload" className="hidden" onChange={(e: ChangeEvent<HTMLInputElement>) => e.target.files && handleImageUpload(e.target.files[0])} /><Button type="button" variant="outline" size="icon" onClick={() => document.getElementById('product-image-upload')?.click()} disabled={actionLoading}><Upload className="h-4 w-4" /></Button></div></div>
              <div><Label>توضیحات</Label><Textarea value={editingProduct.description || ''} onChange={e => handleFormChange('description', e.target.value)} /></div>
              
              {/* v-- CHANGE: Switch components added here --v */}
              <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center space-x-2 space-x-reverse">
                      <Switch id="availability" checked={editingProduct.available} onCheckedChange={(c) => handleFormChange('available', c)} />
                      <Label htmlFor="availability">موجود است</Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                      <Switch id="isFeatured" checked={editingProduct.isFeatured} onCheckedChange={(c) => handleFormChange('isFeatured', c)} />
                      <Label htmlFor="isFeatured">محصول ویژه</Label>
                  </div>
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
    </div>
  );
}