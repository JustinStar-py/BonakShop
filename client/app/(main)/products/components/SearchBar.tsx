"use client";

import { memo } from 'react';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';

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
        <Loader2 className="absolute right-3 top-3 h-5 w-5 text-teal-500 animate-spin" />
      ) : (
        <Search className="absolute right-3 top-3 h-5 w-5 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
      )}
      <Input
        placeholder="جستجوی محصول..."
        className="pr-10 h-11 rounded-xl bg-gray-100 border-transparent focus:bg-white focus:border-teal-500 transition-all text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="جستجوی محصول"
      />
    </div>
  );
});
