import { useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import type { ProductFilters, SortOption } from '../types';

export function useFilters() {
  const searchParams = useSearchParams();
  
  const [filters, setFilters] = useState<ProductFilters>({
    category: searchParams.get('categoryId') || 'all',
    supplier: searchParams.get('supplierId') || 'all',
    search: '',
    sort: 'newest',
  });

  const updateFilter = useCallback((key: keyof ProductFilters, value: string | SortOption) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      category: 'all',
      supplier: 'all',
      search: '',
      sort: 'newest',
    });
  }, []);

  const activeFiltersCount = 
    (filters.category !== 'all' ? 1 : 0) + 
    (filters.supplier !== 'all' ? 1 : 0);

  return {
    filters,
    updateFilter,
    resetFilters,
    activeFiltersCount,
  };
}
