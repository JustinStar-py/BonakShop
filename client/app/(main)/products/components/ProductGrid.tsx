"use client";

import { memo } from 'react';
import ProductCard from '@/components/shared/ProductCard';
import { Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Product } from '@/types';

interface ProductGridProps {
  products: Product[];
  cart: any[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onSelectProduct: (product: Product) => void;
  onSupplierClick: (supplierId: string) => void;
  onRetry: () => void;
  onClearFilters: () => void;
}

export const ProductGrid = memo(function ProductGrid({
  products,
  cart,
  isLoading,
  isLoadingMore,
  hasMore,
  error,
  onAddToCart,
  onUpdateQuantity,
  onSelectProduct,
  onSupplierClick,
  onRetry,
  onClearFilters,
}: ProductGridProps) {
  if (error) {
    return (
      <div className="text-center text-red-500 p-8 flex flex-col items-center gap-2">
        <span>{error}</span>
        <Button variant="outline" size="sm" onClick={onRetry}>
          تلاش مجدد
        </Button>
      </div>
    );
  }

  if (!isLoading && products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 animate-in fade-in zoom-in duration-500">
        <Search size={48} className="mb-4 text-gray-200" />
        <p className="font-medium">محصولی یافت نشد!</p>
        <p className="text-xs mt-1 text-center px-4">
          فیلترها را تغییر دهید یا عبارت دیگری جستجو کنید.
        </p>
        <Button variant="link" className="text-teal-500 mt-2" onClick={onClearFilters}>
          پاک کردن فیلترها
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 grid grid-cols-2 gap-3">
        {products.map((product, index) => (
          <div
            key={product.id}
            className="animate-in fade-in slide-in-from-bottom-4 duration-300"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <ProductCard
              product={product as any}
              cartItem={cart.find((item) => item.id === product.id)}
              onAddToCart={onAddToCart}
              onUpdateQuantity={onUpdateQuantity}
              onSelectProduct={onSelectProduct}
              onImageClick={() => {}}
              onSupplierClick={onSupplierClick}
            />
          </div>
        ))}
      </div>

      {isLoadingMore && (
        <div className="text-center py-6 flex justify-center">
          <Loader2 className="h-8 w-8 text-teal-500 animate-spin" />
        </div>
      )}

      {!hasMore && products.length > 0 && (
        <div className="text-center text-gray-400 py-8 text-xs flex flex-col items-center gap-2">
          <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
          <span>پایان لیست محصولات</span>
        </div>
      )}
    </>
  );
});
