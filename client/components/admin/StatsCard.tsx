// FILE: components/admin/StatsCard.tsx
// DESCRIPTION: Modern stats card with animations for admin dashboard

'use client';

import React from 'react';
import { EnhancedCard, EnhancedCardContent, EnhancedCardHeader, EnhancedCardTitle } from '@/components/ui/enhanced-card';
import { cn } from '@/lib/utils';

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    trend?: {
        value: string;
        isPositive?: boolean;
        label?: string;
    };
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
    className?: string;
}

const variantStyles = {
    default: 'border-zinc-200',
    primary: 'border-primary/30 bg-gradient-to-br from-primary/5 to-transparent',
    success: 'border-emerald-300/30 bg-gradient-to-br from-emerald-50 to-transparent',
    warning: 'border-amber-300/30 bg-gradient-to-br from-amber-50 to-transparent',
    danger: 'border-red-300/30 bg-gradient-to-br from-red-50 to-transparent',
};

const iconBgStyles = {
    default: 'bg-zinc-100 text-zinc-600',
    primary: 'bg-primary/10 text-primary',
    success: 'bg-emerald-100 text-emerald-600',
    warning: 'bg-amber-100 text-amber-600',
    danger: 'bg-red-100 text-red-600',
};

export default function StatsCard({
    title,
    value,
    icon: Icon,
    trend,
    variant = 'default',
    className
}: StatsCardProps) {
    return (
        <EnhancedCard
            variant="elevated"
            interactive
            className={cn(
                'overflow-hidden transition-all duration-300 border-2',
                variantStyles[variant],
                className
            )}
        >
            <EnhancedCardHeader className="flex flex-row items-center justify-between pb-2">
                <EnhancedCardTitle className="text-sm font-medium text-zinc-600">
                    {title}
                </EnhancedCardTitle>
                <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center',
                    'transition-transform duration-300 group-hover:scale-110',
                    iconBgStyles[variant]
                )}>
                    <Icon size={20} />
                </div>
            </EnhancedCardHeader>

            <EnhancedCardContent className="space-y-2">
                <div className="text-3xl font-bold text-zinc-900 animate-fadeIn">
                    {value}
                </div>

                {trend && (
                    <div className="flex items-center gap-2 text-sm animate-slideInRight">
                        <span className={cn(
                            'font-semibold px-2 py-1 rounded-md',
                            trend.isPositive !== false
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-red-100 text-red-700'
                        )}>
                            {trend.value}
                        </span>
                        <span className="text-zinc-500 text-xs">
                            {trend.label || 'نسبت به ماه قبل'}
                        </span>
                    </div>
                )}
            </EnhancedCardContent>
        </EnhancedCard>
    );
}
