"use client";

import type { Product, Supplier } from "@/types";
import type { CartItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Minus } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface NewProductCardProps {
  product: Product & { supplier: Supplier };
  cartItem: CartItem | undefined;
  onAddToCart: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  onUpdateQuantity: (productId: string, newQuantity: number) => void;
  onImageClick: (imageUrl: string) => void;
}

export default function NewProductCard({
  product,
  cartItem,
  onAddToCart,
  onSelectProduct,
  onUpdateQuantity,
  onImageClick,
}: NewProductCardProps) {
  const [imageError, setImageError] = useState(false);
  const quantityInCart = cartItem?.quantity || 0;
  const hasDiscount = product.discountPercentage > 0;
  const discountedPrice = product.price * (1 - product.discountPercentage / 100);

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.image) {
      onImageClick(product.image);
    }
  };

  const toPersianDigits = (num: number) => {
    const persian = {
      0: "۰", 1: "۱", 2: "۲", 3: "۳", 4: "۴", 5: "۵", 6: "۶", 7: "۷", 8: "۸", 9: "۹"
    };
    return num.toString().replace(/\d/g, (d) => persian[d as unknown as keyof typeof persian]);
  };

  return (
    <Card className="overflow-hidden border-2 border-gray-200 hover:border-green-200 transition-colors rounded-lg flex flex-col justify-between relative p-3 font-sans">
      
      {/* Supplier Name Badge */}
      <div className="absolute top-0 right-0 bg-teal-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-md z-10">
        {product.supplier.name}
      </div>

      {/* Stock Badge */}
      <div className="absolute top-0 left-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-br-lg rounded-tl-md z-10">
        {toPersianDigits(product.stock)} {product.unit} 
      </div>

      <div className="flex-grow flex flex-col cursor-pointer" onClick={() => onSelectProduct(product)}>
        <div className="flex justify-center items-center h-28 cursor-pointer" onClick={handleImageClick}>
          <Image
            src={imageError ? "/placeholder.jpg" : product.image || "/placeholder.jpg"}
            alt={product.name}
            width={100}
            height={100}
            loading="lazy"
            onError={() => setImageError(true)}
            className="object-contain max-h-full"
          />
        </div>

        <h3 className="font-medium text-gray-700 text-sm leading-tight line-clamp-2 mt-2">
          {product.name}
        </h3>
      </div>

      <div className="pt-2">
                {/* خط بالای قیمت */}
        <hr className="border-gray-200 mt-2 mb-1" />

        {/* بخش قیمت چسبیده به پایین */}
        <div className="flex flex-col items-end pb-2">
          {hasDiscount && (
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-white bg-yellow-500 font-bold px-2 py-0.5 rounded-md">
                ٪{toPersianDigits(product.discountPercentage)}-
              </span>
              <span className="text-sm text-gray-400 line-through">
                {toPersianDigits(product.price)}
              </span>
            </div>
          )}
          <div className="text-gray-800 font-bold text-lg text-right">
            <span>{toPersianDigits(discountedPrice)}</span>
            <span className="text-xs font-normal">تومان</span>
          </div>
        </div>

        {!product.available ? (
          <Button size="sm" variant="outline" className="w-full h-9 rounded-xl font-bold bg-red-900 text-white disabled:bg-red-700 disabled:opacity-100" disabled>
            ناموجود
          </Button>
        ) : quantityInCart === 0 ? (
          <Button
            size="sm"
            className="w-full bg-blue-500 hover:bg-green-700 h-9 rounded-xl font-bold gap-0.5"
            onClick={() => onAddToCart(product)}
          >
            <Plus className="h-4 w-4" />
            افزودن
          </Button>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="default"
              size="icon"
              className="h-9 w-9 rounded-full bg-blue-500 hover:bg-green-700"
              onClick={() => onUpdateQuantity(product.id, quantityInCart + 1)}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <span className="font-bold text-lg w-8 text-center">{toPersianDigits(quantityInCart)}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full"
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
