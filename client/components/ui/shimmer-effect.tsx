// FILE: components/ui/shimmer-effect.tsx
// DESCRIPTION: Skeleton loader with shimmer animation for better perceived performance

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ShimmerProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'rect' | 'circle' | 'text' | 'card';
    lines?: number;
}

export function Shimmer({ className, variant = 'rect', lines = 1, ...props }: ShimmerProps) {
    const baseClasses = 'animate-pulse bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 bg-[length:200%_100%]';

    const variantClasses = {
        rect: 'rounded-lg h-32',
        circle: 'rounded-full w-12 h-12',
        text: 'rounded h-4',
        card: 'rounded-xl h-64'
    };

    if (variant === 'text' && lines > 1) {
        return (
            <div className="space-y-2">
                {Array.from({ length: lines }).map((_, i) => (
                    <div
                        key={i}
                        className={cn(
                            baseClasses,
                            variantClasses.text,
                            i === lines - 1 && 'w-3/4',
                            className
                        )}
                        {...props}
                    />
                ))}
            </div>
        );
    }

    return (
        <div
            className={cn(baseClasses, variantClasses[variant], className)}
            style={{
                animation: 'shimmer 2s infinite linear',
                backgroundSize: '200% 100%'
            }}
            {...props}
        />
    );
}

// Predefined skeleton components
export function ProductCardSkeleton() {
    return (
        <div className="bg-white rounded-xl p-4 space-y-3">
            <Shimmer variant="rect" className="h-48" />
            <Shimmer variant="text" lines={2} />
            <div className="flex justify-between items-center">
                <Shimmer className="w-20 h-6" />
                <Shimmer variant="circle" className="w-8 h-8" />
            </div>
        </div>
    );
}

export function ListSkeleton({ count = 5 }: { count?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="flex gap-3 items-center">
                    <Shimmer variant="circle" />
                    <div className="flex-1">
                        <Shimmer variant="text" />
                    </div>
                </div>
            ))}
        </div>
    );
}

// Add shimmer keyframe to global CSS
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
  `;
    document.head.appendChild(style);
}
