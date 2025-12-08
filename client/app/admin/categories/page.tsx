// FILE: app/admin/categories/page.tsx
"use client";

import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import type { Category } from "@prisma/client";
import Image from "next/image";
import apiClient from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Pencil, PlusCircle, Trash2, Upload, ArrowRightLeft, Search } from "lucide-react";

type CategoryForm = Pick<Category, "id" | "name" | "icon" | "image"> & {
  icon?: string;
  image?: string;
};

export default function CategoryManagementPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<CategoryForm | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; categoryId: string | null; categoryName: string | null }>({ isOpen: false, categoryId: null, categoryName: null });
    const [moveDialog, setMoveDialog] = useState<{ isOpen: boolean; sourceId: string; targetId: string }>({ isOpen: false, sourceId: "", targetId: "" });
    const [searchQuery, setSearchQuery] = useState("");

    const fetchCategories = async () => {
        setIsLoading(true);
        try {
            const res = await apiClient.get('/categories');
            setCategories(res.data);
        } catch(e) { console.error(e); } 
        finally { setIsLoading(false); }
    };
    useEffect(() => { fetchCategories(); }, []);

    const filteredCategories = categories.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleOpenDialog = (category: CategoryForm | null = null) => {
        setEditingCategory(category || { id: "", name: "", icon: "", image: "" });
        setIsDialogOpen(true);
    };

    const handleFormChange = <K extends keyof CategoryForm>(field: K, value: CategoryForm[K]) => {
        setEditingCategory((prev) => (prev ? { ...prev, [field]: value } : prev));
    };
    
    const handleImageUpload = async (file: File) => {
        if (!file) return;
        setActionLoading(true);
        const formData = new FormData();
        formData.append("image", file);
        try {
            const res = await fetch(`https://api.imgbb.com/1/upload?key=4b2ba5e2eec4847988305b536b6f4a50`, { method: "POST", body: formData });
            const data = await res.json();
            if (data.success) {
                handleFormChange('image', data.data.url);
            } else { alert("آپلود عکس موفق نبود."); }
        } catch { alert("خطا در آپلود عکس"); } 
        finally { setActionLoading(false); }
    };
    
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!editingCategory) return;
        setActionLoading(true);
        const isEditing = Boolean(editingCategory.id);
        const url = isEditing && editingCategory.id ? `/categories/${editingCategory.id}` : '/categories';
        const method = isEditing ? 'PUT' : 'POST';
        const payload = isEditing
            ? editingCategory
            : {
                name: editingCategory.name,
                icon: editingCategory.icon,
                image: editingCategory.image,
            };
        try {
            await apiClient.request({ url, method, data: payload });
            await fetchCategories();
            setIsDialogOpen(false);
        } catch (error) { alert(getErrorMessage(error, "خطا در ذخیره دسته‌بندی")); } 
        finally { setActionLoading(false); }
    };
    
    const handleDelete = async (categoryId: string | null) => {
        if (!categoryId) return;
        setActionLoading(true);
        try {
            await apiClient.delete(`/categories/${categoryId}`);
            await fetchCategories();
            setDeleteDialog({ isOpen: false, categoryId: null, categoryName: null });
        } catch (error) { alert(getErrorMessage(error, "خطا در حذف دسته‌بندی")); } 
        finally { setActionLoading(false); }
    };

    const handleMoveProducts = async () => {
        if (!moveDialog.sourceId || !moveDialog.targetId) {
            alert("لطفا دسته‌بندی مبدا و مقصد را انتخاب کنید.");
            return;
        }
        if (moveDialog.sourceId === moveDialog.targetId) {
            alert("دسته‌بندی مبدا و مقصد نمی‌توانند یکسان باشند.");
            return;
        }

        setActionLoading(true);
        try {
            const res = await apiClient.post('/admin/categories/move-products', {
                sourceCategoryId: moveDialog.sourceId,
                targetCategoryId: moveDialog.targetId
            });
            alert(res.data.message);
            setMoveDialog({ isOpen: false, sourceId: "", targetId: "" });
            // Optional: Refresh categories if counts were displayed, but for now we just move products.
        } catch (error) {
            console.error(error);
            alert(getErrorMessage(error, "خطا در جابجایی محصولات"));
        } finally {
            setActionLoading(false);
        }
    };

    if (isLoading) return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-3xl font-bold">مدیریت دسته‌بندی‌ها</h1>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="جستجو در دسته‌بندی‌ها..."
                            className="w-full pr-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setMoveDialog({ isOpen: true, sourceId: "", targetId: "" })}>
                            <ArrowRightLeft className="ml-2 h-4 w-4" />
                            انتقال محصولات
                        </Button>
                        <Button onClick={() => handleOpenDialog()}><PlusCircle className="ml-2 h-4 w-4" />افزودن دسته‌بندی</Button>
                    </div>
                </div>
            </div>
            <Card>
                <CardContent className="pt-6">
                    <Table>
                        <TableHeader><TableRow><TableHead className="w-[80px] text-right">تصویر</TableHead><TableHead className="w-[80px] text-right">آیکون</TableHead><TableHead className="text-right">نام</TableHead><TableHead className="text-center w-[120px]">عملیات</TableHead></TableRow></TableHeader>
                        <TableBody>{filteredCategories.map(c => (<TableRow key={c.id}>
                            <TableCell className="text-right">
                                <Image
                                    src={c.image || "/placeholder.svg"}
                                    alt={c.name}
                                    width={48}
                                    height={48}
                                    className="h-12 w-12 rounded-md object-cover"
                                />
                            </TableCell>
                            <TableCell className="text-right"><span className="text-2xl">{c.icon}</span></TableCell>
                            <TableCell className="font-medium text-right">{c.name}</TableCell>
                            <TableCell className="text-center"><div className="flex justify-center gap-2">
                                <Button size="sm" variant="outline" onClick={() => handleOpenDialog()}><Pencil className="h-4 w-4" /></Button>
                                <Button size="sm" variant="destructive" onClick={() => setDeleteDialog({ isOpen: true, categoryId: c.id, categoryName: c.name })}><Trash2 className="h-4 w-4" /></Button>
                            </div></TableCell>
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
                        <div><Label>تصویر</Label><div className="flex items-center gap-2"><Input value={editingCategory.image || ''} onChange={e => handleFormChange('image', e.target.value)} placeholder="آدرس را وارد یا آپلود کنید"/><input type="file" accept="image/*" id="category-image-upload" className="hidden" onChange={(e: ChangeEvent<HTMLInputElement>) => e.target.files && handleImageUpload(e.target.files[0])}/><Button type="button" variant="outline" size="icon" onClick={() => document.getElementById('category-image-upload')?.click()} disabled={actionLoading}><Upload className="h-4 w-4"/></Button></div></div>
                        <DialogFooter><Button type="button" variant="secondary" onClick={() => setIsDialogOpen(false)}>انصراف</Button><Button type="submit" disabled={actionLoading}>{actionLoading ? <Loader2 className="animate-spin" /> : "ذخیره"}</Button></DialogFooter>
                    </form>}
                </DialogContent>
            </Dialog>
            <Dialog open={deleteDialog.isOpen} onOpenChange={() => setDeleteDialog({ isOpen: false, categoryId: null, categoryName: null })}>
                <DialogContent dir="rtl">
                    <DialogHeader><DialogTitle>حذف دسته‌بندی</DialogTitle></DialogHeader>
                    <p>آیا مطمئن هستید که می‌خواهید دسته‌بندی &quot;{deleteDialog.categoryName}&quot; را حذف کنید؟ این عملیات غیرقابل بازگشت است.</p>
                    <DialogFooter>
                        <Button variant="secondary" onClick={() => setDeleteDialog({ isOpen: false, categoryId: null, categoryName: null })}>انصراف</Button>
                        <Button variant="destructive" onClick={() => handleDelete(deleteDialog.categoryId)} disabled={actionLoading}>{actionLoading ? <Loader2 className="animate-spin" /> : "تایید حذف"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={moveDialog.isOpen} onOpenChange={(open) => setMoveDialog(prev => ({ ...prev, isOpen: open }))}>
                <DialogContent dir="rtl" className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>انتقال محصولات بین دسته‌بندی‌ها</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>از دسته‌بندی (مبدا)</Label>
                            <Select
                                value={moveDialog.sourceId}
                                onValueChange={(value) => setMoveDialog(prev => ({ ...prev, sourceId: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="انتخاب دسته‌بندی مبدا" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex justify-center">
                            <ArrowRightLeft className="h-6 w-6 text-muted-foreground rotate-90" />
                        </div>
                        <div className="space-y-2">
                            <Label>به دسته‌بندی (مقصد)</Label>
                            <Select
                                value={moveDialog.targetId}
                                onValueChange={(value) => setMoveDialog(prev => ({ ...prev, targetId: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="انتخاب دسته‌بندی مقصد" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.filter(c => c.id !== moveDialog.sourceId).map((c) => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="secondary" onClick={() => setMoveDialog({ isOpen: false, sourceId: "", targetId: "" })}>انصراف</Button>
                        <Button onClick={handleMoveProducts} disabled={actionLoading || !moveDialog.sourceId || !moveDialog.targetId}>
                            {actionLoading ? <Loader2 className="animate-spin" /> : "انتقال محصولات"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
