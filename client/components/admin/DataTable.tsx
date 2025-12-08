// FILE: components/admin/DataTable.tsx
// DESCRIPTION: Modern data table with advanced features

'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal } from 'lucide-react';
import { EnhancedCard, EnhancedCardContent } from '@/components/ui/enhanced-card';
import { Shimmer } from '@/components/ui/shimmer-effect';

interface Column<T> {
    key: string;
    label: string;
    render?: (item: T) => React.ReactNode;
    width?: string;
    align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    isLoading?: boolean;
    searchable?: boolean;
    searchPlaceholder?: string;
    onSearch?: (term: string) => void;
    pagination?: {
        currentPage: number;
        totalPages: number;
        onPageChange: (page: number) => void;
    };
    actions?: React.ReactNode;
    emptyMessage?: string;
}

export default function DataTable<T extends Record<string, any>>({
    data,
    columns,
    isLoading,
    searchable,
    searchPlaceholder = 'جستجو...',
    onSearch,
    pagination,
    actions,
    emptyMessage = 'داده‌ای یافت نشد'
}: DataTableProps<T>) {
    const [searchTerm, setSearchTerm] = useState('');

    const handleSearch = (value: string) => {
        setSearchTerm(value);
        onSearch?.(value);
    };

    return (
        <div className="space-y-4">
            {/* Header with search and actions */}
            {(searchable || actions) && (
                <div className="flex flex-col md:flex-row gap-4 justify-between">
                    {searchable && (
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 h-5 w-5" />
                            <Input
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
                                placeholder={searchPlaceholder}
                                className="pr-10 border-2 focus:border-primary/50 transition-colors"
                            />
                        </div>
                    )}

                    {actions && (
                        <div className="flex gap-2 flex-wrap">
                            {actions}
                        </div>
                    )}
                </div>
            )}

            {/* Table Card */}
            <EnhancedCard variant="elevated" className="overflow-hidden">
                <EnhancedCardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-zinc-50 hover:bg-zinc-50">
                                    {columns.map((column) => (
                                        <TableHead
                                            key={column.key}
                                            className={`font-bold text-zinc-700 ${column.align === 'center' ? 'text-center' :
                                                    column.align === 'left' ? 'text-left' : 'text-right'
                                                }`}
                                            style={{ width: column.width }}
                                        >
                                            {column.label}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {isLoading ? (
                                    // Loading skeleton
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            {columns.map((col) => (
                                                <TableCell key={col.key}>
                                                    <Shimmer variant="text" />
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : data.length === 0 ? (
                                    // Empty state
                                    <TableRow>
                                        <TableCell
                                            colSpan={columns.length}
                                            className="h-32 text-center"
                                        >
                                            <div className="flex flex-col items-center gap-2 text-zinc-400">
                                                <SlidersHorizontal className="h-12 w-12" />
                                                <p className="text-sm font-medium">{emptyMessage}</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    // Data rows
                                    data.map((item, index) => (
                                        <TableRow
                                            key={item.id || index}
                                            className="hover:bg-zinc-50/50 transition-colors animate-fadeIn"
                                            style={{ animationDelay: `${index * 50}ms` }}
                                        >
                                            {columns.map((column) => (
                                                <TableCell
                                                    key={column.key}
                                                    className={
                                                        column.align === 'center' ? 'text-center' :
                                                            column.align === 'left' ? 'text-left' : 'text-right'
                                                    }
                                                >
                                                    {column.render
                                                        ? column.render(item)
                                                        : item[column.key]
                                                    }
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </EnhancedCardContent>
            </EnhancedCard>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                        disabled={pagination.currentPage === 1}
                        className="gap-1"
                    >
                        <ChevronRight size={16} />
                        قبلی
                    </Button>

                    <span className="text-sm font-medium text-zinc-600">
                        صفحه {pagination.currentPage.toLocaleString('fa-IR')} از {pagination.totalPages.toLocaleString('fa-IR')}
                    </span>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                        disabled={pagination.currentPage === pagination.totalPages}
                        className="gap-1"
                    >
                        بعدی
                        <ChevronLeft size={16} />
                    </Button>
                </div>
            )}
        </div>
    );
}
