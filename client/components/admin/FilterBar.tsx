// FILE: components/admin/FilterBar.tsx
// DESCRIPTION: Reusable filter bar with multiple filter types

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, SlidersHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface Filter {
    id: string;
    label: string;
    type: 'select' | 'date-range';
    options?: { value: string; label: string }[];
    value?: string;
    onChange: (value: string) => void;
}

interface FilterBarProps {
    filters: Filter[];
    activeFiltersCount?: number;
    onClearAll?: () => void;
}

export default function FilterBar({
    filters,
    activeFiltersCount = 0,
    onClearAll
}: FilterBarProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="space-y-3">
            {/* Filter Toggle Button */}
            <div className="flex items-center gap-3">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="gap-2"
                >
                    <SlidersHorizontal size={16} />
                    فیلترها
                    {activeFiltersCount > 0 && (
                        <Badge variant="default" className="mr-1 px-1.5 py-0.5 text-xs">
                            {activeFiltersCount}
                        </Badge>
                    )}
                </Button>

                {activeFiltersCount > 0 && onClearAll && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClearAll}
                        className="gap-1 text-zinc-500 hover:text-zinc-900"
                    >
                        <X size={14} />
                        پاک کردن همه
                    </Button>
                )}
            </div>

            {/* Filter Options */}
            {isExpanded && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-zinc-50 rounded-lg border-2 border-zinc-200 animate-fadeIn">
                    {filters.map((filter) => (
                        <div key={filter.id} className="space-y-2">
                            <label className="text-sm font-medium text-zinc-700">
                                {filter.label}
                            </label>

                            {filter.type === 'select' && filter.options && (
                                <Select
                                    value={filter.value}
                                    onValueChange={filter.onChange}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder={`همه ${filter.label}`} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {filter.options.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
