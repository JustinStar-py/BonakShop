// FILE: components/shared/ReturnRequestDialog.tsx (New File)
"use client";

import { useState, useEffect } from "react";
import type { Order, OrderItem } from "@prisma/client";
import apiClient from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Minus, Loader2 } from "lucide-react";

type OrderWithItems = Order & { items: OrderItem[] };

interface ReturnRequestDialogProps {
    order: OrderWithItems | null;
    onOpenChange: () => void;
    onSuccess: () => void;
}

export function ReturnRequestDialog({ order, onOpenChange, onSuccess }: ReturnRequestDialogProps) {
    const [returnItems, setReturnItems] = useState<{ [key: string]: number }>({});
    const [reason, setReason] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (order) {
            const initialItems: { [key: string]: number } = {};
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

        if (itemsToReturn.length === 0) {
            alert("لطفا حداقل یک محصول برای مرجوعی انتخاب کنید.");
            return;
        }
        
        setIsLoading(true);
        try {
            await apiClient.post('/returns', {
                orderId: order.id,
                reason,
                items: itemsToReturn
            });
            alert("درخواست مرجوعی با موفقیت ثبت شد.");
            onSuccess();
        } catch (e: any) {
            console.error(e);
            alert(e.response?.data?.error || "خطا در ثبت درخواست مرجوعی");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={!!order} onOpenChange={onOpenChange}>
            <DialogContent className="z-60">
                <DialogHeader>
                    <DialogTitle>ثبت مرجوعی برای سفارش #{order?.id.slice(-6)}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                    <p className="text-sm text-muted-foreground">
                        محصولات و تعداد مورد نظر برای مرجوعی را انتخاب کنید.
                    </p>
                    {order?.items.map((item: OrderItem) => (
                        <div key={item.id} className="flex justify-between items-center border-b pb-2">
                            <div>
                                <p className="font-semibold">{item.productName}</p>
                                <p className="text-xs">تعداد در سفارش: {item.quantity}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(item.id, item.quantity, -1)}>
                                    <Minus className="h-4 w-4" />
                                </Button>
                                <span className="w-8 text-center font-bold">{returnItems[item.id] || 0}</span>
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(item.id, item.quantity, 1)}>
                                    <Plus className="h-4 w-4" />
                                </Button>
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