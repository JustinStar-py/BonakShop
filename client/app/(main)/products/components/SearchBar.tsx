"use client";

import { memo } from 'react';
import { Input } from '@/components/ui/input';
import { MagniferLinear, RestartLinear } from '@solar-icons/react-perf';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  isSearching?: boolean;
}

export const SearchBar = memo(function SearchBar({
  value,
  onChange,
  isSearching = false
}: SearchBarProps) {
  return (
    <div className="relative flex-grow group">
      {isSearching ? (
        <RestartLinear className="absolute right-3 top-3 h-5 w-5 text-green-500 animate-spin" />
      ) : (
        <MagniferLinear className="absolute right-3 top-3 h-5 w-5 text-gray-400 group-focus-within:text-green-500 transition-colors" />
      )}
      <Input
        placeholder="جستجوی محصول..."
        className="pr-10 h-11 rounded-xl bg-gray-100 border-transparent focus:bg-white focus:border-green-500 transition-all text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="جستجوی محصول"
      />
    </div>
  );
});
