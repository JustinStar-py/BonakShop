"use client";

import { Badge } from "@/components/ui/badge";
import { Calendar, Package, ChevronLeft, CreditCard } from "lucide-react";
import toPersianDigits from "@/utils/persianNum";
import { Order, OrderItem } from "@prisma/client";

// تعریف دقیق تایپ ورودی طبق دیتای شما
type OrderCardProps = {
  order: Order & { items: OrderItem[] };
};

export default function OrderCard({ order }: OrderCardProps) {
  // لاجیک وضعیت‌ها طبق فایل orders/page.tsx شما
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'PENDING': return { label: "در انتظار تایید", color: "bg-yellow-100 text-yellow-700 border-yellow-200", badge: "default" };
      case 'SHIPPED': return { label: "ارسال شده", color: "bg-blue-100 text-blue-700 border-blue-200", badge: "secondary" };
      case 'DELIVERED': return { label: "تحویل شده", color: "bg-green-100 text-green-700 border-green-200", badge: "success" };
      case 'CANCELED': return { label: "لغو شده", color: "bg-red-100 text-red-700 border-red-200", badge: "destructive" };
      default: return { label: status, color: "bg-gray-100", badge: "outline" };
    }
  };

  const statusInfo = getStatusInfo(order.status);
  const date = new Date(order.createdAt).toLocaleDateString('fa-IR');

  return (
    <div className="w-full bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 group">
      {/* ردیف بالا: شماره سفارش و وضعیت */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex flex-col">
          <span className="text-xs text-gray-400 mb-1">شماره سفارش</span>
          <span className="font-mono font-bold text-gray-800 tracking-wider">
            #{order.id.slice(-6).toUpperCase()}
          </span>
        </div>
        <Badge variant={statusInfo.badge as any} className="rounded-lg px-2 py-1 font-normal">
          {statusInfo.label}
        </Badge>
      </div>

      <div className="h-[1px] bg-gray-50 w-full my-2"></div>

      {/* ردیف وسط: اطلاعات کلیدی */}
      <div className="grid grid-cols-2 gap-4 py-2">
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar className="w-4 h-4 text-teal-500" />
          <span className="text-xs">{date}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600 justify-end">
          <Package className="w-4 h-4 text-teal-500" />
          <span className="text-xs">{toPersianDigits(order.items.length)} قلم کالا</span>
        </div>
      </div>

      {/* ردیف پایین: قیمت و دکمه */}
      <div className="flex justify-between items-center mt-3 pt-2 border-t border-dashed border-gray-100">
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-400">مبلغ کل</span>
          <div className="flex items-center gap-1 text-teal-700">
            <span className="font-bold text-lg">{toPersianDigits(order.totalPrice)}</span>
            <span className="text-xs">ریال</span>
          </div>
        </div>
        
        <div className="flex items-center text-teal-500 text-xs font-bold group-hover:-translate-x-1 transition-transform">
          مشاهده جزئیات
          <ChevronLeft className="w-4 h-4 mr-1" />
        </div>
      </div>
    </div>
  );
}