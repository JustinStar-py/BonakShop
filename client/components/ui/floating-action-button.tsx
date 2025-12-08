// FILE: components/ui/floating-action-button.tsx
// DESCRIPTION: Material Design FAB with smooth animations

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface FloatingActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    icon: LucideIcon;
    label?: string;
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    variant?: 'primary' | 'secondary' | 'success' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    extended?: boolean;
}

const FAB = React.forwardRef<HTMLButtonElement, FloatingActionButtonProps>(
    ({
        icon: Icon,
        label,
        position = 'bottom-right',
        variant = 'primary',
        size = 'md',
        extended = false,
        className,
        ...props
    }, ref) => {
        const positions = {
            'bottom-right': 'fixed bottom-6 right-6',
            'bottom-left': 'fixed bottom-6 left-6',
            'top-right': 'fixed top-6 right-6',
            'top-left': 'fixed top-6 left-6'
        };

        const variants = {
            primary: 'bg-primary hover:bg-primary-hover text-white shadow-lg shadow-primary/30',
            secondary: 'bg-zinc-700 hover:bg-zinc-800 text-white shadow-lg shadow-zinc-700/30',
            success: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30',
            danger: 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30'
        };

        const sizes = {
            sm: 'w-12 h-12',
            md: 'w-14 h-14',
            lg: 'w-16 h-16'
        };

        const iconSizes = {
            sm: 20,
            md: 24,
            lg: 28
        };

        return (
            <button
                ref={ref}
                className={cn(
                    'group flex items-center justify-center gap-2 rounded-full',
                    'transition-all duration-300 ease-out z-50',
                    'hover:scale-110 active:scale-95',
                    'focus:outline-none focus:ring-4 focus:ring-offset-2',
                    extended ? 'px-6 h-14' : sizes[size],
                    positions[position],
                    variants[variant],
                    className
                )}
                {...props}
            >
                <Icon
                    size={iconSizes[size]}
                    className={cn(
                        'transition-transform duration-300',
                        'group-hover:rotate-12'
                    )}
                />
                {extended && label && (
                    <span className="font-semibold text-sm whitespace-nowrap">
                        {label}
                    </span>
                )}
            </button>
        );
    }
);

FAB.displayName = 'FloatingActionButton';

export default FAB;
