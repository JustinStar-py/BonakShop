"use client";

import { Button } from "@/components/ui/button";
import ProductCard from "@/components/shared/ProductCard";
import { Product, CartItem, ProductWithSupplier } from "@/types";
import { ArrowLeft, Bell } from "lucide-react";
import { ElementType } from "react";

interface ProductCarouselProps {
  title: string;
  icon?: ElementType;
  products: ProductWithSupplier[];
  cart: CartItem[];
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, newQuantity: number) => void;
  onSelectProduct: (product: Product) => void;
  onImageClick: (imageUrl: string) => void;
  onSupplierClick: (supplierId: string) => void;
  onViewAll: () => void;
  accentColorClass?: string;
  showStrip?: boolean;
}

export default function ProductCarousel({
  title,
  icon: Icon,
  products,
  cart,
  onAddToCart,
  onUpdateQuantity,
  onSelectProduct,
  onImageClick,
  onSupplierClick,
  onViewAll,
  accentColorClass = "bg-[#ff3659]", // Default accent color
  showStrip = true,
}: ProductCarouselProps) {
  if (!products || products.length === 0) return null;

  const StripIcon = Icon || Bell;

  return (
    <div className="py-4 my-2 border-t border-b border-gray-200 bg-gray-50">
      {/* Header Section */}
      <div className="flex items-center justify-between px-4 mb-3">
        <div className="flex items-center gap-2">
          {Icon && (
            <div className="p-1.5 bg-white rounded-lg text-green-600 shadow-sm">
              <Icon className="h-5 w-5" />
            </div>
          )}
          <div className="flex flex-col">
            <h2 className="text-sm font-bold text-gray-800">{title}</h2>
            <span className="text-[11px] text-gray-400">پرفروش‌ترین‌ها</span>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-green-600 h-8 px-2 hover:bg-green-50 hover:text-green-700"
          onClick={onViewAll}
        >
          مشاهده همه <ArrowLeft className="w-3 h-3 mr-1" />
        </Button>
      </div>

      {/* Products + Vertical Strip */}
      <div className="px-3">
        <div className="flex items-stretch gap-2">
          {/* Vertical Strip (Right side) */}
          {showStrip && (
            <button
              onClick={onViewAll}
              className={`
                flex-shrink-0
                w-[48px]
                h-[250px]
                self-start
                flex flex-col items-center justify-flex-start
                rounded-xl
                text-white shadow-md
                gap-y-10 pt-10
                active:scale-95 transition-transform duration-150
                ${accentColorClass}
              `}
            >
              <StripIcon className="w-6 h-6 mb-4 animate-bounce" />
              <span className="text-[15px] font-black whitespace-nowrap rotate-90 leading-none">
                {title}
              </span>
            </button>
          )}

          {/* Scrollable Product List */}
          <div
            className="flex-1 overflow-x-auto pb-3 pr-1
                       [-ms-overflow-style:none] [scrollbar-width:none]
                       [&::-webkit-scrollbar]:hidden"
          >
            <div className="flex gap-x-3">
              {products.map((product) => (
                <div key={product.id} className="flex-shrink-0 w-[160px]">
                  <ProductCard
                    product={product}
                    cartItem={cart.find((ci) => ci.id === product.id)}
                    onAddToCart={onAddToCart}
                    onUpdateQuantity={onUpdateQuantity}
                    onSelectProduct={onSelectProduct}
                    onImageClick={onImageClick}
                    onSupplierClick={onSupplierClick}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
