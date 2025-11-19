"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import apiClient from "@/lib/apiClient";
import type { Category, Supplier, Product } from "@/types";

import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { SearchBar } from "./components/SearchBar";
import { FilterSheet } from "./components/FilterSheet";
import { SortBar } from "./components/SortBar";
import { ActiveFilters } from "./components/ActiveFilters";
import { ProductGrid } from "./components/ProductGrid";

import { useFilters } from "./hooks/useFilters";
import { useProducts } from "./hooks/useProducts";
import { useInfiniteScroll } from "./hooks/useInfiniteScroll";
import useDebounce from "@/hooks/useDebounce";

export default function ProductsPage() {
  const { cart, addToCart, updateCartQuantity } = useAppContext();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const { filters, updateFilter, resetFilters, activeFiltersCount } = useFilters();
  const debouncedSearch = useDebounce(filters.search, 500);

  const productsState = useProducts({
    ...filters,
    search: debouncedSearch,
  });

  useInfiniteScroll(productsState.loadMore, productsState.isLoadingMore, productsState.hasMore);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [categoriesRes, suppliersRes] = await Promise.all([
          apiClient.get("/categories"),
          apiClient.get("/suppliers"),
        ]);
        setCategories(categoriesRes.data);
        setSuppliers(suppliersRes.data);
      } catch (err) {
        console.error("Error loading initial data:", err);
      } finally {
        setIsInitialLoading(false);
      }
    };
    loadInitialData();
  }, []);

  const handleSelectProduct = (product: Product) => {
    router.push(`/products/${product.id}`);
  };

  const handleSupplierClick = (supplierId: string) => {
    updateFilter('supplier', supplierId);
    updateFilter('category', 'all');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearFilters = () => {
    resetFilters();
    setIsFilterOpen(false);
  };

  if (isInitialLoading) {
    return <LoadingSpinner message="در حال بارگذاری محصولات..." />;
  }

  return (
    <div className="pb-24 min-h-screen bg-gray-50">
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm px-4 py-3">
        <div className="flex gap-3 mb-3">
          <SearchBar
            value={filters.search}
            onChange={(value) => updateFilter('search', value)}
            isSearching={productsState.isLoading && !!debouncedSearch}
          />
          <FilterSheet
            isOpen={isFilterOpen}
            onOpenChange={setIsFilterOpen}
            categories={categories}
            suppliers={suppliers}
            selectedCategory={filters.category}
            selectedSupplier={filters.supplier}
            onCategoryChange={(id) => updateFilter('category', id)}
            onSupplierChange={(id) => updateFilter('supplier', id)}
            onClearFilters={handleClearFilters}
            activeFiltersCount={activeFiltersCount}
          />
        </div>

        <SortBar
          value={filters.sort}
          onChange={(value) => updateFilter('sort', value)}
        />

        <ActiveFilters
          searchTerm={filters.search}
          categoryId={filters.category}
          supplierId={filters.supplier}
          categories={categories}
          suppliers={suppliers}
          onRemoveSearch={() => updateFilter('search', '')}
          onRemoveCategory={() => updateFilter('category', 'all')}
          onRemoveSupplier={() => updateFilter('supplier', 'all')}
        />
      </header>

      <ProductGrid
        products={productsState.products}
        cart={cart}
        isLoading={productsState.isLoading}
        isLoadingMore={productsState.isLoadingMore}
        hasMore={productsState.hasMore}
        error={productsState.error}
        onAddToCart={addToCart}
        onUpdateQuantity={updateCartQuantity}
        onSelectProduct={handleSelectProduct}
        onSupplierClick={handleSupplierClick}
        onRetry={productsState.refetch}
        onClearFilters={handleClearFilters}
      />
    </div>
  );
}
