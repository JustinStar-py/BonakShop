"use client";

import type { ProductWithRelations, CartItem } from "@/types";
import { Plus, Minus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import toPersianDigits from "@/utils/numberFormatter";
import { formatToTomanParts } from "@/utils/currencyFormatter";

interface ProductCardProps {
  product: ProductWithRelations;
  cartItem: CartItem | undefined;
  onAddToCart: (product: ProductWithRelations) => void;
  onSelectProduct: (product: ProductWithRelations) => void;
  onUpdateQuantity: (productId: string, newQuantity: number) => void;
  onImageClick?: (imageUrl: string) => void;
  onSupplierClick?: (supplierId: string) => void;
}

export default function ProductCard({
  product,
  cartItem,
  onAddToCart,
  onSelectProduct,
  onUpdateQuantity,
}: ProductCardProps) {
  const [imageError, setImageError] = useState(false);

  const quantityInCart = cartItem?.quantity || 0;
  const hasDiscount = product.discountPercentage > 0;

  const discountedPrice = product.price * (1 - product.discountPercentage / 100);
  const formattedPrice = formatToTomanParts(product.price);
  const formattedDiscountedPrice = formatToTomanParts(discountedPrice);

  const animatePlus = (target: HTMLElement) => {
    target.animate(
      [
        { transform: "scale(1)" },
        { transform: "scale(0.9)" },
        { transform: "scale(1)" },
      ],
      { duration: 160, easing: "ease-out" }
    );
  };

  const handleIncrement = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    animatePlus(e.currentTarget);

    if (quantityInCart === 0) {
      onAddToCart(product);
    } else {
      onUpdateQuantity(product.id, quantityInCart + 1);
    }
  };

  const handleDecrement = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (quantityInCart > 0) {
      onUpdateQuantity(product.id, quantityInCart - 1);
    }
  };

  return (
    <div
      className="relative flex h-[230px] flex-col rounded-xl bg-white px-4 pt-4 pb-3 shadow-sm transition-all duration-200 hover:shadow-md overflow-hidden"
      onClick={() => onSelectProduct(product)}
    >
      {/* Image + Buttons */}
      <div className="relative -mx-4 -mt-2 mb-2 flex h-32 items-center justify-center">
        <Image
          src={imageError ? "/placeholder.jpg" : product.image || "/placeholder.jpg"}
          alt={product.name}
          fill
          sizes="(min-width:1024px) 180px, 45vw"
          className="object-contain"
          onError={() => setImageError(true)}
        />

        {/* Plus Button / Counter */}
        {quantityInCart === 0 ? (
          <button
            onClick={handleIncrement}
            className="absolute bottom-2 right-3 flex h-9 w-9 items-center justify-center rounded-xl border border-[#FF3D57] bg-white text-[#FF3D57] shadow-sm transition-transform duration-150 active:scale-95"
          >
            <Plus strokeWidth={3} className="h-4 w-4" />
          </button>
        ) : (
          <div className="absolute bottom-2 right-3 flex items-center gap-1 rounded-xl border border-[#FF3D57] bg-white px-2 py-1 shadow-sm">
            <button
              onClick={handleIncrement}
              className="flex h-7 w-7 items-center justify-center text-[#00A79D] transition-transform duration-150 active:scale-95"
            >
              <Plus className="h-4 w-4" strokeWidth={3} />
            </button>

            <span className="px-1 text-[12px] font-bold text-gray-800">
              {toPersianDigits(quantityInCart)}
            </span>

            <button
              onClick={handleDecrement}
              className="flex h-7 w-7 items-center justify-center text-[#FF3D57] transition-transform duration-150 active:scale-95"
            >
              {quantityInCart === 1 ? (
                <Trash2 className="h-4 w-4" />
              ) : (
                <Minus className="h-4 w-4" strokeWidth={3} />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Discount Badge */}
      {hasDiscount && (
        <div className="absolute top-2 left-2 rounded-full bg-[#FF3D57] px-2 py-0.5 text-[13px] font-bold text-white">
          {toPersianDigits(product.discountPercentage)}٪
        </div>
      )}

      {/* Product Name */}
      <h3 className="mb-1 line-clamp-2 px-1 text-right text-[12px] font-semibold text-gray-800 leading-snug min-h-[34px]">
        {product.name}
      </h3>

      {/* Pricing */}
      <div className="mt-auto flex items-end justify-end">
        <div className="flex flex-col items-end">
          <div
            className={`mb-0.5 flex items-baseline gap-1 text-gray-400 text-[11px] font-medium ${!(hasDiscount && formattedPrice) ? "invisible" : ""
              }`}
          >
            <span className="line-through">{formattedPrice?.amount ?? ""}</span>
            <span className="text-[10px]">
              {formattedPrice?.suffix ?? ""}
            </span>
          </div>

          <div className="flex items-baseline gap-1 text-gray-800">
            <span className="text-[15px] font-extrabold tracking-tight">
              {(formattedDiscountedPrice || formattedPrice)?.amount}
            </span>
            <span className="text-[9px] font-medium text-gray-500">
              {(formattedDiscountedPrice || formattedPrice)?.suffix}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}