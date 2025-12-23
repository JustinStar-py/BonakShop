// FILE: app/admin/companies/page.tsx (UI FIX: Operations column moved to the left)
"use client";

import { useState, useEffect, useMemo, FormEvent, useCallback } from "react";
import type { Supplier, Distributor } from "@prisma/client";
import apiClient from "@/lib/apiClient";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RestartLinear as Loader2, AddCircleLinear as PlusCircle, Pen2Linear as Pencil, TrashBinMinimalisticLinear as Trash2 } from "@solar-icons/react-perf";

type CompanyType = "supplier" | "distributor";
type CompanyItem = Supplier | Distributor;

type EditableCompany = {
    id?: string;
    name: string;
    logo?: string | null;
};

const logoLoader = ({ src }: { src: string }) => src;

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

function ManageCompanyType({ type }: { type: CompanyType }) {
    const [items, setItems] = useState<CompanyItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<EditableCompany | null>(null);
    const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; itemId: string | null; itemName: string | null }>({ isOpen: false, itemId: null, itemName: null });

    const apiPath = useMemo(() => (type === 'supplier' ? '/suppliers' : '/distributors'), [type]);
    const title = useMemo(() => (type === 'supplier' ? 'تولیدکننده' : 'پخش‌کننده'), [type]);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await apiClient.get<CompanyItem[]>(apiPath);
            setItems(res.data);
        } catch (e) {
            console.error(`Failed to fetch ${type}s`, e);
        } finally {
            setIsLoading(false);
        }
    }, [apiPath, type]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleOpenDialog = (item: CompanyItem | null = null) => {
        setEditingItem(item || { name: "", logo: "" });
        setIsDialogOpen(true);
    };

    const handleFormChange = (field: keyof EditableCompany, value: string) => {
        setEditingItem((prev) => (prev ? { ...prev, [field]: value } : prev));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!editingItem) return;
        setActionLoading(true);
        const isEditing = !!editingItem.id;
        const url = isEditing ? `${apiPath}/${editingItem.id}` : apiPath;
        const method = isEditing ? 'PUT' : 'POST';
        try {
            await apiClient({ url, method, data: editingItem });
            await fetchData();
            setIsDialogOpen(false);
        } catch (e) {
            alert(`خطا در ذخیره ${title}: ${getErrorMessage(e)}`);
        }
        finally { setActionLoading(false); }
    };

    const handleDelete = async (itemId: string | null) => {
        if (!itemId) return;
        setActionLoading(true);
        try {
            await apiClient.delete(`${apiPath}/${itemId}`);
            await fetchData();
            setDeleteDialog({ isOpen: false, itemId: null, itemName: null });
        } catch (error) {
            alert(`خطا در حذف: ${getErrorMessage(error)}`);
        }
        finally { setActionLoading(false); }
    };

    if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button onClick={() => handleOpenDialog()}><PlusCircle className="ml-2 h-4 w-4" />افزودن {title}</Button>
            </div>
            <Card>
                <CardContent className="pt-6">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className=" w-[120px] text-center">عملیات</TableHead>
                                <TableHead className="w-[80px] text-center">لوگو</TableHead>
                                <TableHead className="text-right">نام</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell className="text-left">
                                        <div className="flex justify-start gap-2">
                                            <Button size="sm" variant="outline" onClick={() => handleOpenDialog(item)}><Pencil className="h-4 w-4" /></Button>
                                            <Button size="sm" variant="destructive" onClick={() => setDeleteDialog({ isOpen: true, itemId: item.id, itemName: item.name })}><Trash2 className="h-4 w-4" /></Button>
                                        </div>
                                    </TableCell>
                                    <TableCell className="grid justify-items-center">
                                        <Image
                                            loader={logoLoader}
                                            unoptimized
                                            src={item.logo || "/placeholder.svg"}
                                            alt={item.name}
                                            width={40}
                                            height={40}
                                            className="h-10 w-10 rounded-full object-contain bg-gray-100 p-1 justify-self-center"
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium text-right">{item.name}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent dir="rtl">
                    <DialogHeader><DialogTitle>{editingItem?.id ? `ویرایش ${title}` : `افزودن ${title} جدید`}</DialogTitle></DialogHeader>
                    {editingItem && (
                        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                            <div><Label>نام {title}</Label><Input value={editingItem.name} onChange={e => handleFormChange('name', e.target.value)} required /></div>
                            <div><Label>لوگو (آدرس URL)</Label><Input value={editingItem.logo || ''} onChange={e => handleFormChange('logo', e.target.value)} /></div>
                            <DialogFooter>
                                <Button type="button" variant="secondary" onClick={() => setIsDialogOpen(false)}>انصراف</Button>
                                <Button type="submit" disabled={actionLoading}>{actionLoading ? <Loader2 className="animate-spin" /> : "ذخیره"}</Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={deleteDialog.isOpen} onOpenChange={() => setDeleteDialog({ isOpen: false, itemId: null, itemName: null })}>
                <DialogContent dir="rtl">
                    <DialogHeader><DialogTitle>حذف {title}</DialogTitle></DialogHeader>
                    <p>آیا مطمئن هستید که می‌خواهید "{deleteDialog.itemName}" را حذف کنید؟</p>
                    <DialogFooter>
                        <Button variant="secondary" onClick={() => setDeleteDialog({ isOpen: false, itemId: null, itemName: null })}>انصراف</Button>
                        <Button variant="destructive" onClick={() => handleDelete(deleteDialog.itemId)} disabled={actionLoading}>{actionLoading ? <Loader2 className="animate-spin" /> : "تایید حذف"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function CompanyManagementPage() {
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

