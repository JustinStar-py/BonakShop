"use client";

import type { ProductWithRelations, CartItem } from "@/types";
import { AddCircleLinear, MinusCircleLinear, TrashBinMinimalisticLinear } from "@solar-icons/react-perf";
import Image from "next/image";
import { useState } from "react";
import toPersianDigits from "@/utils/numberFormatter";
import TomanPrice from "@/components/shared/TomanPrice";

interface ProductCardProps {
  product: ProductWithRelations;
  cartItem: CartItem | undefined;
  onAddToCart: (product: ProductWithRelations) => void;
  onSelectProduct: (product: ProductWithRelations) => void;
  onUpdateQuantity: (productId: string, newQuantity: number) => void;
  onImageClick?: (imageUrl: string) => void;
  onSupplierClick?: (supplierId: string) => void;
  /** Set to true for above-the-fold products to improve LCP */
  priority?: boolean;
}

export default function ProductCard({
  product,
  cartItem,
  onAddToCart,
  onSelectProduct,
  onUpdateQuantity,
  priority = false,
}: ProductCardProps) {
  const [imageError, setImageError] = useState(false);

  const quantityInCart = cartItem?.quantity || 0;
  const hasDiscount = product.discountPercentage > 0;

  const discountedPrice = product.price * (1 - product.discountPercentage / 100);

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
          priority={priority}
          loading={priority ? 'eager' : 'lazy'}
        />

        {/* Plus Button / Counter */}
        {quantityInCart === 0 ? (
          <button
            onClick={handleIncrement}
            className="absolute bottom-2 right-3 flex h-9 w-9 items-center justify-center rounded-xl border border-[#FF3D57] bg-white text-[#FF3D57] shadow-sm transition-transform duration-150 active:scale-95"
          >
            <AddCircleLinear size={20} />
          </button>
        ) : (
          <div className="absolute bottom-2 right-3 flex items-center gap-1 rounded-xl border border-[#FF3D57] bg-white px-2 py-1 shadow-sm">
            <button
              onClick={handleIncrement}
              className="flex h-7 w-7 items-center justify-center text-[#00A79D] transition-transform duration-150 active:scale-95"
            >
              <AddCircleLinear size={18} />
            </button>

            <span className="px-1 text-[12px] font-bold text-gray-800">
              {toPersianDigits(quantityInCart)}
            </span>

            <button
              onClick={handleDecrement}
              className="flex h-7 w-7 items-center justify-center text-[#FF3D57] transition-transform duration-150 active:scale-95"
            >
              {quantityInCart === 1 ? (
                <TrashBinMinimalisticLinear size={18} />
              ) : (
                <MinusCircleLinear size={18} />
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
          <div className={hasDiscount ? "mb-0.5" : "mb-0.5 invisible"}>
            <TomanPrice
              value={product.price}
              className="text-[11px] font-medium"
              amountClassName="line-through text-black/60"
              suffixClassName="text-black/45"
            />
          </div>

          <TomanPrice
            value={hasDiscount ? discountedPrice : product.price}
            className="text-[15px] font-extrabold tracking-tight"
            suffixClassName="text-black/50"
          />
        </div>
      </div>
    </div>
  );
}
