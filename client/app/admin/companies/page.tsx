// FILE: app/admin/companies/page.tsx
"use client";

import { useState, useEffect, useMemo, FormEvent } from "react";
import type { Supplier, Distributor } from "@prisma/client";
import apiClient from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogClose, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, PlusCircle } from "lucide-react";

function ManageCompanyType({ type }: { type: 'supplier' | 'distributor' }) {
    const [items, setItems] = useState<(Supplier | Distributor)[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newItem, setNewItem] = useState({ name: "", logo: "" });
    const [actionLoading, setActionLoading] = useState(false);
    
    const apiPath = useMemo(() => (type === 'supplier' ? '/suppliers' : '/distributors'), [type]);
    const title = useMemo(() => (type === 'supplier' ? 'تولیدکننده' : 'پخش‌کننده'), [type]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const res = await apiClient.get(apiPath);
            setItems(res.data);
        } catch (e) { console.error(`Failed to fetch ${type}s`, e); } 
        finally { setIsLoading(false); }
    };

    useEffect(() => { fetchData(); }, [apiPath]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            await apiClient.post(apiPath, newItem);
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