"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import apiClient from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errors";
import StatsCard from "@/components/admin/StatsCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TomanPrice from "@/components/shared/TomanPrice";
import {
  BillListLinear as BillList,
  CheckCircleLinear as CheckCircle,
  ClockCircleLinear as Clock,
  CloseCircleLinear as CloseCircle,
  DeliveryLinear as Truck,
  MagniferLinear as Search,
  RestartLinear as Loader2,
} from "@solar-icons/react-perf";

type OrderStatus = "PENDING" | "SHIPPED" | "DELIVERED" | "CANCELED";
type PaymentStatus = "PENDING" | "PAID" | "FAILED";

type OrderUser = {
  name: string | null;
  shopName: string | null;
  phone?: string | null;
};

type OrderItem = {
  id: string;
  productName: string;
  quantity: number;
  price: number;
};

type OrderRecord = {
  id: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalPrice: number;
  createdAt: string;
  deliveryDate: string;
  notes: string | null;
  user: OrderUser;
  items: OrderItem[];
};

const orderStatusMeta = {
  PENDING: { label: "در انتظار تایید", variant: "secondary" },
  SHIPPED: { label: "ارسال شده", variant: "default" },
  DELIVERED: { label: "تحویل شده", variant: "success" },
  CANCELED: { label: "لغو شده", variant: "destructive" },
} as const;

const paymentStatusMeta = {
  PENDING: { label: "پرداخت نشده", variant: "secondary" },
  PAID: { label: "پرداخت شده", variant: "success" },
  FAILED: { label: "ناموفق", variant: "destructive" },
} as const;

const statusTabs: Array<{ value: "all" | OrderStatus; label: string }> = [
  { value: "all", label: "همه" },
  { value: "PENDING", label: "در انتظار" },
  { value: "SHIPPED", label: "ارسال شده" },
  { value: "DELIVERED", label: "تحویل شده" },
  { value: "CANCELED", label: "لغو شده" },
];

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fa-IR");
};

const getCustomerName = (order: OrderRecord) =>
  order.user.shopName || order.user.name || "بدون نام";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [paymentFilter, setPaymentFilter] = useState<"all" | PaymentStatus>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await apiClient.get<OrderRecord[]>("/admin/orders");
      setOrders(res.data || []);
    } catch (err) {
      setError(getErrorMessage(err, "خطا در دریافت سفارش‌ها"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const counts = useMemo(() => {
    const next = {
      all: orders.length,
      PENDING: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      CANCELED: 0,
    };
    orders.forEach((order) => {
      next[order.status] += 1;
    });
    return next;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    return orders.filter((order) => {
      if (statusFilter !== "all" && order.status !== statusFilter) {
        return false;
      }
      if (paymentFilter !== "all" && order.paymentStatus !== paymentFilter) {
        return false;
      }
      if (!normalized) return true;

      const customerData = `${order.user.shopName ?? ""} ${order.user.name ?? ""} ${
        order.user.phone ?? ""
      }`.toLowerCase();
      const idMatch = order.id.toLowerCase().includes(normalized);
      const itemMatch = order.items.some((item) =>
        item.productName.toLowerCase().includes(normalized)
      );
      return idMatch || customerData.includes(normalized) || itemMatch;
    });
  }, [orders, paymentFilter, searchTerm, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">مدیریت سفارشات</h1>
          <p className="text-sm text-muted-foreground">
            سفارش‌ها را جستجو و بر اساس وضعیت مدیریت کنید.
          </p>
        </div>
        <Button variant="outline" onClick={fetchOrders} disabled={isLoading} className="gap-2">
          <Loader2 className={isLoading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          بروزرسانی
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatsCard title="کل سفارشات" value={counts.all.toLocaleString("fa-IR")} icon={BillList} variant="primary" />
        <StatsCard title="در انتظار" value={counts.PENDING.toLocaleString("fa-IR")} icon={Clock} variant="warning" />
        <StatsCard title="ارسال شده" value={counts.SHIPPED.toLocaleString("fa-IR")} icon={Truck} variant="default" />
        <StatsCard title="تحویل شده" value={counts.DELIVERED.toLocaleString("fa-IR")} icon={CheckCircle} variant="success" />
        <StatsCard title="لغو شده" value={counts.CANCELED.toLocaleString("fa-IR")} icon={CloseCircle} variant="danger" />
      </div>

      <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as "all" | OrderStatus)}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          {statusTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label} ({counts[tab.value]})
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
        <div className="relative flex-1 max-w-xl w-full">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 h-5 w-5" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجو با نام فروشگاه، موبایل یا کد سفارش..."
            className="pr-10"
          />
        </div>

        <div className="w-full lg:w-60">
          <Select value={paymentFilter} onValueChange={(value) => setPaymentFilter(value as "all" | PaymentStatus)}>
            <SelectTrigger>
              <SelectValue placeholder="فیلتر وضعیت پرداخت" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه پرداخت‌ها</SelectItem>
              <SelectItem value="PENDING">پرداخت نشده</SelectItem>
              <SelectItem value="PAID">پرداخت شده</SelectItem>
              <SelectItem value="FAILED">ناموفق</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="text-xs text-muted-foreground">
          نمایش {filteredOrders.length.toLocaleString("fa-IR")} از {orders.length.toLocaleString("fa-IR")} سفارش
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50">
              <TableHead className="text-right w-[110px]">کد سفارش</TableHead>
              <TableHead className="text-right">مشتری</TableHead>
              <TableHead className="text-right">مبلغ کل</TableHead>
              <TableHead className="text-right">پرداخت</TableHead>
              <TableHead className="text-right">وضعیت سفارش</TableHead>
              <TableHead className="text-right">تاریخ ثبت</TableHead>
              <TableHead className="text-right">اقلام</TableHead>
              <TableHead className="text-center w-[120px]">عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                  در حال دریافت سفارش‌ها...
                </TableCell>
              </TableRow>
            ) : filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                  هیچ سفارشی یافت نشد.
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => {
                const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
                return (
                  <TableRow key={order.id} className="hover:bg-zinc-50/60">
                    <TableCell className="font-semibold">...{order.id.slice(-6)}</TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-800">{getCustomerName(order)}</div>
                      <div className="text-xs text-slate-500">{order.user.phone || "—"}</div>
                    </TableCell>
                    <TableCell>
                      <TomanPrice value={order.totalPrice} />
                    </TableCell>
                    <TableCell>
                      <Badge variant={paymentStatusMeta[order.paymentStatus]?.variant || "secondary"}>
                        {paymentStatusMeta[order.paymentStatus]?.label || order.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={orderStatusMeta[order.status]?.variant || "secondary"}>
                        {orderStatusMeta[order.status]?.label || order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(order.createdAt)}</TableCell>
                    <TableCell>{totalItems.toLocaleString("fa-IR")} قلم</TableCell>
                    <TableCell className="text-center">
                      <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                        جزئیات
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle>جزئیات سفارش ...{selectedOrder.id.slice(-6)}</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-muted-foreground">مشتری</p>
                  <p className="font-medium">{getCustomerName(selectedOrder)}</p>
                  <p className="text-xs text-muted-foreground">{selectedOrder.user.phone || "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">وضعیت‌ها</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={orderStatusMeta[selectedOrder.status]?.variant || "secondary"}>
                      {orderStatusMeta[selectedOrder.status]?.label || selectedOrder.status}
                    </Badge>
                    <Badge variant={paymentStatusMeta[selectedOrder.paymentStatus]?.variant || "secondary"}>
                      {paymentStatusMeta[selectedOrder.paymentStatus]?.label || selectedOrder.paymentStatus}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">تاریخ ثبت</p>
                  <p>{formatDate(selectedOrder.createdAt)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">تاریخ تحویل</p>
                  <p>{formatDate(selectedOrder.deliveryDate)}</p>
                </div>
              </div>
              {selectedOrder.notes && (
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-sm">
                  <p className="text-muted-foreground mb-1">یادداشت سفارش</p>
                  <p>{selectedOrder.notes}</p>
                </div>
              )}

              <div className="rounded-lg border border-slate-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="text-right">محصول</TableHead>
                      <TableHead className="text-center">تعداد</TableHead>
                      <TableHead className="text-right">مبلغ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrder.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell className="text-center">{item.quantity.toLocaleString("fa-IR")}</TableCell>
                        <TableCell>
                          <TomanPrice value={item.price * item.quantity} />
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell className="font-semibold">جمع کل</TableCell>
                      <TableCell />
                      <TableCell className="font-semibold">
                        <TomanPrice value={selectedOrder.totalPrice} />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
