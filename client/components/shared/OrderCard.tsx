"use client";

import { Badge } from "@/components/ui/badge";
import { CalendarLinear, BoxLinear, AltArrowLeftLinear } from "@solar-icons/react-perf";
import toPersianDigits from "@/utils/numberFormatter";
import type { OrderStatus, PaymentStatus } from "@prisma/client";
import { formatToTomanParts } from "@/utils/currencyFormatter";

// تعریف دقیق تایپ ورودی طبق دیتای شما
type OrderCardProps = {
  order: {
    id: string;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    createdAt: string | Date;
    totalPrice: number;
    items: Array<{ id: string }>;
  };
  orderNumber?: number;
};

export default function OrderCard({ order, orderNumber }: OrderCardProps) {
  const getStatusInfo = (args: {
    status: OrderStatus;
    paymentStatus: PaymentStatus;
  }) => {
    const { status, paymentStatus } = args;

    if (status === "CANCELED") {
      return {
        label: "لغو شده",
        className: "bg-red-100 text-red-700 border-red-200",
      };
    }

    if (paymentStatus === "FAILED") {
      return {
        label: "پرداخت ناموفق",
        className: "bg-red-100 text-red-700 border-red-200",
      };
    }

    if (paymentStatus !== "PAID") {
      return {
        label: "در انتظار پرداخت",
        className: "bg-amber-100 text-amber-800 border-amber-200",
      };
    }

    switch (status) {
      case "PENDING":
        return {
          label: "در حال پردازش سفارش",
          className: "bg-blue-50 text-blue-700 border-blue-100",
        };
      case "SHIPPED":
        return {
          label: "ارسال شده",
          className: "bg-blue-100 text-blue-700 border-blue-200",
        };
      case "DELIVERED":
        return {
          label: `تکمیل شده (${toPersianDigits(100)}٪)`,
          className: "bg-green-100 text-green-700 border-green-200",
        };
      default: {
        const _exhaustive: never = status;
        return {
          label: String(_exhaustive),
          className: "bg-gray-100 text-gray-700 border-gray-200",
        };
      }
    }
  };

  const statusInfo = getStatusInfo({
    status: order.status,
    paymentStatus: order.paymentStatus,
  });
  const date = new Date(order.createdAt).toLocaleDateString("fa-IR");
  const totalParts = formatToTomanParts(order.totalPrice);

  return (
    <div className="w-full bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 group">
      {/* ردیف بالا: شماره سفارش و وضعیت */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex flex-col">
          <span className="text-xs text-gray-400 mb-1">شماره سفارش</span>
          <span className="font-mono font-bold text-gray-800 tracking-wider">
            {typeof orderNumber === "number" && Number.isFinite(orderNumber) && orderNumber > 0
              ? `#${toPersianDigits(orderNumber)}`
              : `#${order.id.slice(-6).toUpperCase()}`}
          </span>
        </div>
        <Badge
          variant="outline"
          className={`rounded-lg px-2 py-1 font-normal ${statusInfo.className}`}
        >
          {statusInfo.label}
        </Badge>
      </div>

      <div className="h-[1px] bg-gray-50 w-full my-2"></div>

      {/* ردیف وسط: اطلاعات کلیدی */}
      <div className="grid grid-cols-2 gap-4 py-2">
        <div className="flex items-center gap-2 text-gray-600">
          <CalendarLinear size={16} className="text-green-500" />
          <span className="text-xs">{date}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600 justify-end">
          <BoxLinear size={16} className="text-green-500" />
          <span className="text-xs">{toPersianDigits(order.items.length)} قلم کالا</span>
        </div>
      </div>

      {/* ردیف پایین: قیمت و دکمه */}
      <div className="flex justify-between items-center mt-3 pt-2 border-t border-dashed border-gray-100">
        <div className="flex flex-col items-center justify-center">
          {totalParts ? (
            <div className="flex items-center gap-1 text-green-700">
              <span className="font-bold text-base leading-none">{totalParts.amount}</span>
              <span className="text-[10px] leading-none opacity-70">{totalParts.suffix}</span>
            </div>
          ) : (
            <div className="text-green-700">
              <span className="font-bold text-base leading-none">—</span>
            </div>
          )}
        </div>

        <div className="flex items-center text-green-500 text-xs font-bold group-hover:-translate-x-1 transition-transform">
          مشاهده جزئیات
          <AltArrowLeftLinear size={16} className="mr-1" />
        </div>
      </div>
    </div>
  );
}
