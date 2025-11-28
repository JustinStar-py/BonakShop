"use client";

import type { Product, Supplier } from "@/types";
import type { CartItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Plus, Minus, ShoppingBag } from "lucide-react"; // آیکون جدید اضافه شد
import Image from "next/image";
import { useState } from "react";
import toPersianDigits from "@/utils/persianNum";
import { formatToTomanParts } from "@/utils/toman";

interface NewProductCardProps {
  product: Product & { supplier: Supplier };
  cartItem: CartItem | undefined;
  onAddToCart: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  onUpdateQuantity: (productId: string, newQuantity: number) => void;
  onImageClick: (imageUrl: string) => void;
  onSupplierClick: (supplierId: string) => void;
}

export default function NewProductCard({
  product,
  cartItem,
  onAddToCart,
  onSelectProduct,
  onUpdateQuantity,
  onImageClick,
  onSupplierClick,
}: NewProductCardProps) {
  const [imageError, setImageError] = useState(false);
  const quantityInCart = cartItem?.quantity || 0;
  const hasDiscount = product.discountPercentage > 0;
  const discountedPrice = product.price * (1 - product.discountPercentage / 100);
  const formattedPrice = formatToTomanParts(product.price);
  const formattedDiscountedPrice = formatToTomanParts(discountedPrice);

  const handleSupplierClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSupplierClick(product.supplier.id);
  };

  return (
    <div className="group relative bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-teal-100 transition-all duration-300 flex flex-col min-h-[280px] overflow-hidden font-sans">
      
      {/* بج تخفیف (فقط اگر تخفیف باشد) */}
      {hasDiscount && (
        <div className="absolute top-2 left-2 z-10 bg-gradient-to-r from-red-500 to-rose-500 text-white text-[11px] font-extrabold px-2 py-1 rounded-lg shadow-md">
           ٪{toPersianDigits(product.discountPercentage)}
        </div>
      )}

      {/* بج موجودی (فقط اگر کم باشد) */}
      {product.stock < 10 && product.stock > 0 && (
         <div className="absolute top-2 right-2 z-10 bg-orange-50 text-orange-600 text-[10px] font-bold px-2 py-1 rounded-full border border-orange-200 shadow-sm">
            فقط {toPersianDigits(product.stock)} عدد
         </div>
      )}

      {/* بخش تصویر و اطلاعات کلیک‌خور */}
        <div className="flex-grow p-3 pb-2 flex flex-col cursor-pointer" onClick={() => onSelectProduct(product)}>
          <div className="relative w-full h-28 flex items-center justify-center mb-3 rounded-xl overflow-hidden">
            <Image
              src={imageError ? "/placeholder.jpg" : product.image || "/placeholder.jpg"}
              alt={product.name}
              fill
              loading="lazy"
              sizes="(min-width: 1024px) 180px, 45vw"
              className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
              onError={() => setImageError(true)}
            />
        </div>

        <h3 className="font-semibold text-gray-800 text-[13px] leading-tight line-clamp-2 min-h-[2.5rem] mb-1 group-hover:text-teal-700 transition-colors">
          {product.name}
        </h3>
        
        {/* نام شرکت (ظریف‌تر) */}
        <div 
          onClick={handleSupplierClick} 
          className="text-[11px] text-gray-400 hover:text-teal-600 transition-colors truncate mb-auto"
        >
          {product.supplier.name}
        </div>
      </div>

      {/* بخش قیمت و دکمه */}
      <div className="px-3 pb-3 bg-white">
        <div className="flex flex-col items-end mb-2 space-y-1">
           {hasDiscount && formattedPrice && (
             <span className="text-[11px] text-gray-400 line-through decoration-2 decoration-red-400 flex items-baseline gap-1">
               <span>{formattedPrice.amount}</span>
               <span className="text-[9px]">{formattedPrice.suffix}</span>
             </span>
           )}
           {formattedDiscountedPrice && (
             <div className="flex items-baseline gap-1 text-gray-800">
                <span className="font-extrabold text-sm leading-none">{formattedDiscountedPrice.amount}</span>
                <span className="text-[10px] text-gray-500 font-medium">{formattedDiscountedPrice.suffix}</span>
             </div>
           )}
        </div>

        {!product.available ? (
          <Button className="w-full h-10 rounded-xl bg-gray-100 text-gray-400 cursor-not-allowed hover:bg-gray-100" disabled>
            ناموجود
          </Button>
        ) : quantityInCart === 0 ? (
          <Button
            className="w-full bg-teal-600 hover:bg-teal-700 text-white h-9 rounded-lg shadow-sm shadow-teal-200 active:scale-95 transition-all text-sm"
            onClick={() => onAddToCart(product)}
          >
            <ShoppingBag className="w-4 h-4" />
            افزودن
          </Button>
        ) : (
          <div className="flex items-center justify-between bg-teal-50 rounded-lg p-1 h-9 border border-teal-100">
            <button
              className="w-7 h-7 flex items-center justify-center bg-white text-teal-600 rounded-md shadow-sm active:bg-teal-100 transition-colors"
              onClick={() => onUpdateQuantity(product.id, quantityInCart + 1)}
            >
              <Plus className="w-4 h-4" />
            </button>
            <span className="font-bold text-teal-700 text-base">{toPersianDigits(quantityInCart)}</span>
            <button
              className="w-7 h-7 flex items-center justify-center bg-white text-red-500 rounded-md shadow-sm active:bg-red-50 transition-colors"
              onClick={() => onUpdateQuantity(product.id, quantityInCart - 1)}
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
