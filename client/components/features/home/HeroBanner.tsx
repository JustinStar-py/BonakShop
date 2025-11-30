"use client";

import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface HeroBannerProps {
  promoImage?: string;
}

export default function HeroBanner({ promoImage }: HeroBannerProps) {
  const router = useRouter();

  return (
    <div className="px-4 mt-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-green-500 via-emerald-500 to-cyan-400 text-white shadow-xl">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,white,transparent_35%),radial-gradient(circle_at_80%_0%,white,transparent_25%),radial-gradient(circle_at_40%_60%,white,transparent_25%)]" />
        <div className="relative p-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] mb-1 text-white/80">بهار نارون</p>
            <h1 className="text-xl font-black leading-tight mb-2">خرید سریع، قیمت به‌روز</h1>
            <p className="text-sm text-white/85 mb-4">
              دسته‌بندی دلخواهت را انتخاب کن و در چند کلیک سفارش بده.
            </p>
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant="secondary"
                className="rounded-full bg-white text-green-700 hover:bg-white/90"
                onClick={() => router.push("/products")}
              >
                <ShoppingBag className="w-4 h-4 ml-1" /> شروع خرید
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full border-white/70 text-green-700 hover:bg-white/10"
                onClick={() => router.push("/orders")}
              >
                سفارش‌های من
              </Button>
            </div>
          </div>
          {promoImage && (
            <div className="hidden sm:block w-40 h-28 relative">
              <Image
                src={promoImage}
                alt="promo"
                fill
                className="object-cover rounded-2xl shadow-lg"
                loading="lazy"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
