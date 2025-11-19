"use client";

import { memo } from 'react';
import { ArrowUpDown } from 'lucide-react';
import { SORT_OPTIONS } from '../constants';
import type { SortOption } from '../types';

interface SortBarProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

export const SortBar = memo(function SortBar({ value, onChange }: SortBarProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
      <span className="text-xs text-gray-400 whitespace-nowrap flex items-center gap-1">
        <ArrowUpDown size={12} /> مرتب‌سازی:
      </span>
      {SORT_OPTIONS.map((option) => (
        <button
          key={option.id}
          onClick={() => onChange(option.id as SortOption)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
            value === option.id
              ? 'bg-gray-800 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          aria-pressed={value === option.id}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
});
