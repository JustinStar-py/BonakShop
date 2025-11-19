import type { Product } from '@/types';

export type SortOption = 'newest' | 'priceAsc' | 'priceDesc' | 'bestselling';

export interface ProductFilters {
  category: string;
  supplier: string;
  search: string;
  sort: SortOption;
}

export interface ProductsState {
  products: Product[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;
}
