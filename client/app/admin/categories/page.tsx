// FILE: app/admin/categories/page.tsx
"use client";

import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import type { Category } from "@prisma/client";
import apiClient from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Pencil, PlusCircle, Trash2, Upload } from "lucide-react";

export default function CategoryManagementPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<any | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; categoryId: string | null; categoryName: string | null }>({ isOpen: false, categoryId: null, categoryName: null });

    const fetchCategories = async () => {
        setIsLoading(true);
        try {
            const res = await apiClient.get('/categories');
            setCategories(res.data);
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
        } catch (err) { alert("خطا در آپلود عکس"); } 
        finally { setActionLoading(false); }
    };
    
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!editingCategory) return;
        setActionLoading(true);
        const isEditing = !!editingCategory.id;
        const url = isEditing ? `/categories/${editingCategory.id}` : '/categories';
        const method = isEditing ? 'PUT' : 'POST';
        try {
            await apiClient({ url, method, data: editingCategory });
            await fetchCategories();
            setIsDialogOpen(false);
        } catch (e) { alert(`خطا در ذخیره دسته‌بندی: ${e}`); } 
        finally { setActionLoading(false); }
    };
    
    const handleDelete = async (categoryId: string | null) => {
        if (!categoryId) return;
        setActionLoading(true);
        try {
            await apiClient.delete(`/categories/${categoryId}`);
            await fetchCategories();
            setDeleteDialog({ isOpen: false, categoryId: null, categoryName: null });
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
                            <TableCell className="text-center"><div className="flex justify-center gap-2">
                                <Button size="sm" variant="outline" onClick={() => handleOpenDialog(c)}><Pencil className="h-4 w-4" /></Button>
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
                    <p>آیا مطمئن هستید که می‌خواهید دسته‌بندی "{deleteDialog.categoryName}" را حذف کنید؟ این عملیات غیرقابل بازگشت است.</p>
                    <DialogFooter>
                        <Button variant="secondary" onClick={() => setDeleteDialog({ isOpen: false, categoryId: null, categoryName: null })}>انصراف</Button>
                        <Button variant="destructive" onClick={() => handleDelete(deleteDialog.categoryId)} disabled={actionLoading}>{actionLoading ? <Loader2 className="animate-spin" /> : "تایید حذف"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}