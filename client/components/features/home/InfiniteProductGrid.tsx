"use client";

import { Button } from "@/components/ui/button";
import ProductCard from "@/components/shared/ProductCard";
import { Product, CartItem, ProductWithSupplier } from "@/types";
import { WidgetLinear, AltArrowLeftLinear, RestartLinear } from "@solar-icons/react-perf";
import { useRouter } from "next/navigation";

interface InfiniteProductGridProps {
  products: ProductWithSupplier[];
  cart: CartItem[];
  isLoadingMore: boolean;
  hasMore: boolean;
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, newQuantity: number) => void;
  onSelectProduct: (product: Product) => void;
  onImageClick: (imageUrl: string) => void;
  onSupplierClick: (supplierId: string) => void;
}

export default function InfiniteProductGrid({
  products,
  cart,
  isLoadingMore,
  hasMore,
  onAddToCart,
  onUpdateQuantity,
  onSelectProduct,
  onImageClick,
  onSupplierClick,
}: InfiniteProductGridProps) {
  const router = useRouter();

  return (
    <div className="bg-white rounded-t-[2rem] shadow-[0_-10px_30px_rgba(0,0,0,0.03)] border-t border-gray-100 mt-2">
      <div className="p-4">
        <div className="flex justify-between items-center mb-5 mt-2">
          <h2 className="text-md font-bold text-gray-800 flex items-center gap-2">
            <WidgetLinear className="text-green-500" size={18} /> همه محصولات
          </h2>
          <Button
            variant="ghost"
            className="text-green-600 text-xs hover:bg-green-50"
            onClick={() => router.push("/products")}
          >
            مشاهده لیست کامل <AltArrowLeftLinear className="mr-1 h-3 w-3" />
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              cartItem={cart.find((ci) => ci.id === p.id)}
              onAddToCart={onAddToCart}
              onUpdateQuantity={onUpdateQuantity}
              onSelectProduct={onSelectProduct}
              onImageClick={onImageClick}
              onSupplierClick={onSupplierClick}
            />
          ))}
        </div>
        {isLoadingMore && (
          <div className="py-8 flex justify-center">
            <RestartLinear className="animate-spin text-green-500 w-8 h-8" />
          </div>
        )}
        {!hasMore && products.length > 0 && (
          <div className="text-center py-10 text-gray-400 text-xs flex flex-col items-center gap-2">
            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
            <p>تمام محصولات نمایش داده شدند</p>
          </div>
        )}
      </div>
    </div>
  );
}
