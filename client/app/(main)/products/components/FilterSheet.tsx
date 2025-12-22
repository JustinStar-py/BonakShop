"use client";

import { memo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FilterLinear, TagLinear, CheckCircleLinear as Check } from '@solar-icons/react-perf';
import type { Category, Supplier } from '@/types';

interface FilterSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  suppliers: Supplier[];
  selectedCategory: string;
  selectedSupplier: string;
  onCategoryChange: (id: string) => void;
  onSupplierChange: (id: string) => void;
  onClearFilters: () => void;
  activeFiltersCount: number;
}

export const FilterSheet = memo(function FilterSheet({
  isOpen,
  onOpenChange,
  categories,
  suppliers,
  selectedCategory,
  selectedSupplier,
  onCategoryChange,
  onSupplierChange,
  onClearFilters,
  activeFiltersCount,
}: FilterSheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="h-11 px-3 rounded-xl border-gray-200 bg-white hover:bg-gray-50 relative"
          aria-label="فیلتر محصولات"
        >
          <FilterLinear size={20} className="text-gray-600" />
          {activeFiltersCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-green-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent side="bottom" className="rounded-t-[2rem] p-0 max-h-[85vh] overflow-y-auto">
        <SheetHeader className="p-5 border-b sticky top-0 bg-white z-10">
          <div className="flex justify-between items-center">
            <SheetTitle className="text-right flex items-center gap-2 text-gray-800">
              <FilterLinear size={18} /> فیلتر محصولات
            </SheetTitle>
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 h-8 text-xs hover:text-red-600"
                onClick={onClearFilters}
              >
                حذف همه
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="p-5 space-y-6">
          <div>
            <h3 className="font-bold text-sm mb-3 text-gray-700 flex items-center gap-2">
              <TagLinear size={16} /> دسته‌بندی
            </h3>
            <div className="flex flex-wrap gap-2">
              <CategoryBadge
                label="همه"
                isSelected={selectedCategory === 'all'}
                onClick={() => onCategoryChange('all')}
              />
              {categories.map((cat) => (
                <CategoryBadge
                  key={cat.id}
                  label={cat.name}
                  isSelected={selectedCategory === cat.id}
                  onClick={() => onCategoryChange(cat.id)}
                />
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-bold text-sm mb-3 text-gray-700">تامین‌کننده / برند</h3>
            <div className="grid grid-cols-2 gap-2">
              <SupplierItem
                label="همه برندها"
                isSelected={selectedSupplier === 'all'}
                onClick={() => onSupplierChange('all')}
              />
              {suppliers.map((sup) => (
                <SupplierItem
                  key={sup.id}
                  label={sup.name}
                  isSelected={selectedSupplier === sup.id}
                  onClick={() => onSupplierChange(sup.id)}
                />
              ))}
            </div>
          </div>

          <div className="sticky bottom-0 bg-white pt-4 pb-8 border-t mt-8">
            <Button
              className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg rounded-xl shadow-lg shadow-green-100"
              onClick={() => onOpenChange(false)}
            >
              مشاهده نتایج
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
});

const CategoryBadge = memo(function CategoryBadge({
  label,
  isSelected,
  onClick,
}: {
  label: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <Badge
      variant={isSelected ? 'default' : 'outline'}
      className={`cursor-pointer h-9 px-4 rounded-lg transition-all ${isSelected ? 'bg-green-500 hover:bg-green-600' : 'hover:bg-gray-100'
        }`}
      onClick={onClick}
    >
      {label}
    </Badge>
  );
});

const SupplierItem = memo(function SupplierItem({
  label,
  isSelected,
  onClick,
}: {
  label: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${isSelected
        ? 'border-green-500 bg-green-50 text-green-700'
        : 'border-gray-200 hover:border-gray-300'
        }`}
      onClick={onClick}
    >
      <span className="text-sm truncate">{label}</span>
      {isSelected && <Check size={16} />}
    </div>
  );
});
