"use client";

import { useState, useCallback } from "react";
import apiClient from "@/lib/apiClient";
import { Product, ProductWithSupplier } from "@/types";

export default function useProductPagination<T extends Product = ProductWithSupplier>() {
  const [products, setProducts] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPaginatedProducts = useCallback(
    async (
      pageNum: number,
      search: string,
      categoryId = "all",
      isNewSearch = false
    ) => {
      setIsLoadingMore(true);
      setError(null);
      try {
        const response = await apiClient.get(
          `/products?page=${pageNum}&limit=12&search=${search}&categoryId=${
            categoryId === "all" ? "" : categoryId
          }`
        );
        const newProducts = response.data.products;
        setProducts((prev) => {
          if (isNewSearch) return newProducts;
          const existingIds = new Set(prev.map((p) => p.id));
          return [
            ...prev,
            ...newProducts.filter((p: T) => !existingIds.has(p.id)),
          ];
        });
        setHasMore(newProducts.length > 0);
        setPage(isNewSearch ? 2 : (p) => p + 1);
      } catch (err) {
        setError("خطا در بارگذاری محصولات.");
        console.error(err);
      } finally {
        setIsLoadingMore(false);
      }
    },
    []
  );

  const resetPagination = useCallback(() => {
    setProducts([]);
    setPage(1);
    setHasMore(true);
  }, []);

  return {
    products,
    setProducts,
    page,
    setPage,
    hasMore,
    setHasMore,
    isLoadingMore,
    error,
    fetchPaginatedProducts,
    resetPagination,
  };
}
