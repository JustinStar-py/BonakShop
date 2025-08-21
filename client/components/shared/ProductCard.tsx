"use client";

import type { Product, Supplier } from "@/types";
import type { CartItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, Tag, Building } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface ProductCardProps {
  product: Product & { supplier: Supplier };
  cartItem: CartItem | undefined;
  onAddToCart: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  onUpdateQuantity: (productId: string, newQuantity: number) => void;
  onImageClick: (imageUrl: string) => void;
  onSupplierClick: (supplierId: string) => void; // Prop to handle supplier click event
}

export default function ProductCard({
  product,
  cartItem,
  onAddToCart,
  onSelectProduct,
  onUpdateQuantity,
  onImageClick,
  onSupplierClick,
}: ProductCardProps) {
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

  const handleSupplierBadgeClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card's onClick from firing
    onSupplierClick(product.supplier.id);
  };

  return (
    <Card className={`overflow-hidden gap-1.5 border-2 ${hasDiscount ? 'border-red-500' : 'border-gray-200'} hover:border-green-200 transition-colors rounded-2xl flex flex-col justify-between relative p-2`}>
      {hasDiscount && (
        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 z-5">
          <Tag className="h-3 w-3" />
          {product.discountPercentage}%
        </div>
      )}
      <div className="absolute top-2 right-2 z-5">
        <Badge
          variant="secondary"
          className="flex items-center gap-1 cursor-pointer"
          onClick={handleSupplierBadgeClick}
        >
          <Building className="h-3 w-3" />
          {product.supplier.name}
        </Badge>
      </div>

      <div className="flex-grow flex flex-col cursor-pointer" onClick={() => onSelectProduct(product)}>
        <div className="flex justify-center mt-8 mb-1 cursor-pointer" onClick={handleImageClick}>
          <Image
            src={imageError ? "/placeholder.jpg" : product.image || "/placeholder.jpg"}
            alt={product.name}
            width={80}
            height={80}
            loading="lazy"
            onError={() => setImageError(true)}
            className="object-cover rounded-xl"
          />
        </div>

        <div className="flex-grow flex flex-col justify-end">
          <h3 className={`font-medium text-right ${product.name.length > 13 ? product.name.length > 20 ? 'text-[12px]' : 'text-[15px]' : 'text-small'} leading-tight min-h-[1.5rem] px-1`}>
            {product.name}
          </h3>

          <div className="text-green-800 font-bold text-left px-1">
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
      </div>

      <div className="text-xs text-gray-500 text-right px-1">
        {product.unit}
      </div>

      <div className="pt-2">
        {!product.available ? (
          <Button size="sm" variant="outline" className="w-full h-9 rounded-xl font-bold" disabled>
            ناموجود
          </Button>
        ) : quantityInCart === 0 ? (
          <Button
            size="sm"
            className="w-full bg-green-600 hover:bg-green-700 h-9 rounded-xl font-bold gap-0.5"
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
              className="h-9 w-9 rounded-full bg-green-600 hover:bg-green-700"
              onClick={() => onUpdateQuantity(product.id, quantityInCart + 1)}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <span className="font-bold text-lg w-8 text-center">{quantityInCart}</span>
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