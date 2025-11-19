"use client";

import { memo } from 'react';
import { X } from 'lucide-react';
import type { Category, Supplier } from '@/types';

interface ActiveFiltersProps {
  searchTerm: string;
  categoryId: string;
  supplierId: string;
  categories: Category[];
  suppliers: Supplier[];
  onRemoveSearch: () => void;
  onRemoveCategory: () => void;
  onRemoveSupplier: () => void;
}

export const ActiveFilters = memo(function ActiveFilters({
  searchTerm,
  categoryId,
  supplierId,
  categories,
  suppliers,
  onRemoveSearch,
  onRemoveCategory,
  onRemoveSupplier,
}: ActiveFiltersProps) {
  if (!searchTerm && categoryId === 'all' && supplierId === 'all') return null;

  return (
    <div className="flex flex-wrap gap-2 mt-3 animate-in fade-in slide-in-from-top-2 duration-300">
      {searchTerm && (
        <FilterChip label={`جستجو: ${searchTerm}`} onRemove={onRemoveSearch} color="blue" />
      )}
      {categoryId !== 'all' && (
        <FilterChip
          label={categories.find((c) => c.id === categoryId)?.name || ''}
          onRemove={onRemoveCategory}
          color="teal"
        />
      )}
      {supplierId !== 'all' && (
        <FilterChip
          label={suppliers.find((s) => s.id === supplierId)?.name || ''}
          onRemove={onRemoveSupplier}
          color="purple"
        />
      )}
    </div>
  );
});

interface FilterChipProps {
  label: string;
  onRemove: () => void;
  color: 'blue' | 'teal' | 'purple';
}

const FilterChip = memo(function FilterChip({ label, onRemove, color }: FilterChipProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    teal: 'bg-teal-50 text-teal-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className={`flex items-center gap-1 ${colorClasses[color]} px-2 py-1 rounded-md text-[10px] animate-in fade-in zoom-in duration-200`}>
      <span>{label}</span>
      <X size={12} className="cursor-pointer hover:scale-110 transition-transform" onClick={onRemove} />
    </div>
  );
});
