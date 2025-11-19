import { useState, useCallback, useEffect } from 'react';
import apiClient from '@/lib/apiClient';
import type { Product } from '@/types';
import type { ProductFilters, ProductsState } from '../types';
import { PRODUCTS_PER_PAGE } from '../constants';

export function useProducts(filters: ProductFilters) {
  const [state, setState] = useState<ProductsState>({
    products: [],
    isLoading: true,
    isLoadingMore: false,
    error: null,
    hasMore: true,
    page: 1,
  });

  const buildQueryString = useCallback((pageNum: number) => {
    const params = new URLSearchParams({
      page: pageNum.toString(),
      limit: PRODUCTS_PER_PAGE.toString(),
      search: filters.search,
    });

    if (filters.category !== 'all') params.append('categoryId', filters.category);
    if (filters.supplier !== 'all') params.append('supplierId', filters.supplier);

    switch (filters.sort) {
      case 'priceAsc': params.append('sortBy', 'price'); params.append('order', 'asc'); break;
      case 'priceDesc': params.append('sortBy', 'price'); params.append('order', 'desc'); break;
      case 'bestselling': params.append('sortBy', 'sales'); params.append('order', 'desc'); break;
      default: params.append('sortBy', 'createdAt'); params.append('order', 'desc');
    }

    return params.toString();
  }, [filters]);

  const fetchProducts = useCallback(async (pageNum: number, reset = false) => {
    if (!reset && state.isLoadingMore) return;

    setState(prev => ({ 
      ...prev, 
      isLoadingMore: !reset,
      isLoading: reset 
    }));

    try {
      const queryString = buildQueryString(pageNum);
      const response = await apiClient.get(`/products?${queryString}`);
      const newProducts: Product[] = response.data.products;

      setState(prev => ({
        ...prev,
        products: reset ? newProducts : [...prev.products, ...newProducts.filter(
          np => !prev.products.some(p => p.id === np.id)
        )],
        hasMore: newProducts.length === PRODUCTS_PER_PAGE,
        page: reset ? 2 : prev.page + 1,
        isLoading: false,
        isLoadingMore: false,
        error: null,
      }));

    } catch (err) {
      setState(prev => ({
        ...prev,
        error: 'خطا در بارگذاری محصولات',
        isLoading: false,
        isLoadingMore: false,
      }));
    }
  }, [buildQueryString, state.isLoadingMore]);

  const loadMore = useCallback(() => {
    if (state.hasMore && !state.isLoadingMore) {
      fetchProducts(state.page, false);
    }
  }, [state.hasMore, state.isLoadingMore, state.page, fetchProducts]);

  useEffect(() => {
    fetchProducts(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.category, filters.supplier, filters.search, filters.sort]);

  return {
    ...state,
    loadMore,
    refetch: () => fetchProducts(1, true),
  };
}
