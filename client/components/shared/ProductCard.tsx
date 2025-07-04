// FILE: components/shared/ProductCard.tsx
// Updates:
// - Displays discounted price and original price (strikethrough).
"use client";

import type { Product } from "@/types";
import type { CartItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Minus, Tag } from "lucide-react";

interface ProductCardProps {
  product: Product;
  cartItem: CartItem | undefined;
  onAddToCart: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  onUpdateQuantity: (productId: string, newQuantity: number) => void;
}

export default function ProductCard({
  product,
  cartItem,
  onAddToCart,
  onSelectProduct,
  onUpdateQuantity,
}: ProductCardProps) {
  const quantityInCart = cartItem?.quantity || 0;
  const hasDiscount = product.discountPercentage > 0;
  const discountedPrice = product.price * (1 - product.discountPercentage / 100);

  return (
    <Card className="overflow-hidden border-2 border-gray-100 hover:border-green-200 transition-colors rounded-2xl flex flex-col justify-between relative">
      {hasDiscount && (
        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
          <Tag className="h-3 w-3" />
          {product.discountPercentage}%
        </div>
      )}
      <CardContent className="p-4 pb-2">
        <div className="cursor-pointer" onClick={() => onSelectProduct(product)}>
          <div className="flex justify-center mb-3">
            <img
              src={product.image || "/placeholder.svg"}
              alt={product.name}
              className="h-24 w-24 object-cover rounded-xl"
            />
          </div>
          <h3 className="font-medium text-right mb-2 text-sm leading-relaxed h-10">
            {product.name}
          </h3>
          <div className="text-green-800 font-bold text-right mb-3">
            {hasDiscount ? (
              <div className="flex flex-col items-end">
                <span>{discountedPrice.toLocaleString("fa-IR")} <span className="text-xs font-normal">ریال</span></span>
                <span className="text-xs text-gray-400 line-through">{product.price.toLocaleString("fa-IR")}</span>
              </div>
            ) : (
              <span>{product.price.toLocaleString("fa-IR")} <span className="text-xs font-normal">ریال</span></span>
            )}
          </div>
        </div>
      </CardContent>

      <div className="p-4 pt-0 mt-auto">
        {!product.available ? (
          <Button size="sm" variant="outline" className="w-full h-10 rounded-xl" disabled>
            ناموجود
          </Button>
        ) : quantityInCart === 0 ? (
          <Button
            size="sm"
            className="w-full bg-green-600 hover:bg-green-700 h-10 rounded-xl"
            onClick={() => onAddToCart(product)}
          >
            <Plus className="ml-2 h-4 w-4" />
            افزودن به سبد
          </Button>
        ) : (
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="default"
              size="icon"
              className="h-10 w-10 rounded-full bg-green-600 hover:bg-green-700"
              onClick={() => onUpdateQuantity(product.id, quantityInCart + 1)}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <span className="font-bold text-lg w-10 text-center">{quantityInCart}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full"
              onClick={() => onUpdateQuantity(product.id, quantityInCart - 1)}
            >
              <Minus className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}