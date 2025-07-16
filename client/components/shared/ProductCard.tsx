// FILE: components/shared/ProductCard.tsx
// FINAL VERSION: Aggressively reduced vertical spacing based on user feedback image.
"use client";

import type { Product, Supplier } from "@/types";
import type { CartItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, Tag, Building } from "lucide-react";

interface ProductCardProps {
  product: Product & { supplier: Supplier };
  cartItem: CartItem | undefined;
  onAddToCart: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  onUpdateQuantity: (productId: string, newQuantity: number) => void;
  onImageClick: (imageUrl: string) => void; // New prop to handle image click event
}

export default function ProductCard({
  product,
  cartItem,
  onAddToCart,
  onSelectProduct,
  onUpdateQuantity,
  onImageClick, // New prop to handle image click event
}: ProductCardProps) {
  const quantityInCart = cartItem?.quantity || 0;
  const hasDiscount = product.discountPercentage > 0;
  const discountedPrice = product.price * (1 - product.discountPercentage / 100);

  // This handler will be called when the image is clicked.
  // It stops the event from bubbling up to the parent card's onClick.
  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation to product details page
    if (product.image) {
      onImageClick(product.image);
    }
  };

  return (
    // The main card is a flex container, directing content vertically.
    // Padding is adjusted to `p-2` for a tighter look.
    <Card className={`overflow-hidden gap-1.5 border-2 border-gray-100 hover:border-green-200 transition-colors rounded-2xl flex flex-col justify-between relative p-2`}>
      {/* Badges for discount and supplier are absolutely positioned */}
      {hasDiscount && (
        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 z-10">
          <Tag className="h-3 w-3" />
          {product.discountPercentage}%
        </div>
      )}
       <div className="absolute top-2 right-2 z-10">
         <Badge variant="secondary" className="flex items-center gap-1">
           <Building className="h-3 w-3"/>
           {product.supplier.name}
         </Badge>
       </div>
       
      {/* This div now acts as the main content area that grows and pushes the button down */}
      <div className="flex-grow flex flex-col cursor-pointer" onClick={() => onSelectProduct(product)}>
          {/* Container for the image, with top margin to avoid badges */}
          {/* The image container now has its own onClick handler */}
          <div className="flex justify-center mt-8 mb-1 cursor-pointer" onClick={handleImageClick}>
            <img
              src={product.image || "/placeholder.svg"}
              alt={product.name}
              className="h-20 w-20 object-cover rounded-xl"
            />
          </div>
          
          {/* This div will take up the remaining space and align content to the bottom */}
          <div className="flex-grow flex flex-col justify-end">
            {/* Product name with minimum height for consistency and a small bottom margin */}
            <h3 className={`font-medium text-right text-sm leading-tight min-h-[1.5rem] px-1`}>
              {product.name}
            </h3>
            
            {/* Price section - no vertical margin */}
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

      {/* نشان دادن واحد شمارش */}
      <div className="text-xs text-gray-500 text-right px-1">
        {product.unit}
      </div>

      {/* Action button container - minimal top margin to bring it closer to the price */}
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