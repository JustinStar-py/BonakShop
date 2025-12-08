// FILE: components/ui/smooth-scroll-area.tsx
// DESCRIPTION: Custom scrollbar with smooth scrolling and modern design

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SmoothScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
    maxHeight?: string;
    hideScrollbar?: boolean;
}

export function SmoothScrollArea({
    children,
    className,
    maxHeight = '500px',
    hideScrollbar = false,
    ...props
}: SmoothScrollAreaProps) {
    return (
        <div
            className={cn(
                'overflow-y-auto',
                !hideScrollbar && 'custom-scrollbar',
                className
            )}
            style={{ maxHeight }}
            {...props}
        >
            {children}

            <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 100px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(161, 161, 170, 0.4);
          border-radius: 100px;
          transition: background 0.2s;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(161, 161, 170, 0.7);
        }

        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(161, 161, 170, 0.4) transparent;
          scroll-behavior: smooth;
        }
      `}</style>
        </div>
    );
}
