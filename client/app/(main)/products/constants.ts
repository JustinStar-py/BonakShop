export const SORT_OPTIONS = [
  { id: 'newest', label: 'جدیدترین' },
  { id: 'bestselling', label: 'پرفروش‌ترین' },
  { id: 'priceAsc', label: 'کمترین قیمت' },
  { id: 'priceDesc', label: 'بیشترین قیمت' },
] as const;

export const PRODUCTS_PER_PAGE = 12;
export const SCROLL_THRESHOLD = 250;
export const SEARCH_DEBOUNCE = 500;
