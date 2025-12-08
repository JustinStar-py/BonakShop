// FILE: components/ui/enhanced-card.tsx
// DESCRIPTION: Modern card with glassmorphism, hover effects, and micro-interactions

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface EnhancedCardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'glass' | 'elevated' | 'bordered' | 'gradient';
    interactive?: boolean;
    glow?: boolean;
}

const EnhancedCard = React.forwardRef<HTMLDivElement, EnhancedCardProps>(
    ({ className, variant = 'default', interactive = false, glow = false, children, ...props }, ref) => {
        const variants = {
            default: 'bg-white border border-zinc-200',
            glass: 'bg-white/80 backdrop-blur-md border border-white/20 shadow-lg',
            elevated: 'bg-white shadow-xl border-0',
            bordered: 'bg-white border-2 border-primary/20',
            gradient: 'bg-gradient-to-br from-white to-primary/5 border border-primary/10'
        };

        const interactiveClasses = interactive
            ? 'cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl active:scale-[0.98]'
            : '';

        const glowClasses = glow
            ? 'shadow-[0_0_20px_rgba(22,163,74,0.15)] hover:shadow-[0_0_30px_rgba(22,163,74,0.25)]'
            : '';

        return (
            <div
                ref={ref}
                className={cn(
                    'rounded-xl overflow-hidden',
                    variants[variant],
                    interactiveClasses,
                    glowClasses,
                    className
                )}
                {...props}
            >
                {children}
            </div>
        );
    }
);

EnhancedCard.displayName = 'EnhancedCard';

const EnhancedCardHeader = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn('flex flex-col space-y-1.5 p-6', className)}
        {...props}
    />
));
EnhancedCardHeader.displayName = 'EnhancedCardHeader';

const EnhancedCardTitle = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
    <h3
        ref={ref}
        className={cn('text-2xl font-bold leading-none tracking-tight', className)}
        {...props}
    />
));
EnhancedCardTitle.displayName = 'EnhancedCardTitle';

const EnhancedCardDescription = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
    <p
        ref={ref}
        className={cn('text-sm text-zinc-500', className)}
        {...props}
    />
));
EnhancedCardDescription.displayName = 'EnhancedCardDescription';

const EnhancedCardContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));
EnhancedCardContent.displayName = 'EnhancedCardContent';

const EnhancedCardFooter = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn('flex items-center p-6 pt-0', className)}
        {...props}
    />
));
EnhancedCardFooter.displayName = 'EnhancedCardFooter';

export {
    EnhancedCard,
    EnhancedCardHeader,
    EnhancedCardFooter,
    EnhancedCardTitle,
    EnhancedCardDescription,
    EnhancedCardContent
};
