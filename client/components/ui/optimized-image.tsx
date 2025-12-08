// FILE: components/ui/optimized-image.tsx
// DESCRIPTION: Optimized Image component with lazy loading and blur placeholder

'use client';

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
    src: string | null | undefined;
    alt: string;
    width?: number;
    height?: number;
    fill?: boolean;
    className?: string;
    priority?: boolean;
    quality?: number;
    sizes?: string;
    onClick?: () => void;
    fallback?: string;
}

export default function OptimizedImage({
    src,
    alt,
    width,
    height,
    fill = false,
    className,
    priority = false,
    quality = 75,
    sizes,
    onClick,
    fallback = '/placeholder-product.png'
}: OptimizedImageProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const imageSrc = hasError ? fallback : (src || fallback);

    return (
        <div className={cn('relative overflow-hidden bg-gray-100', className)}>
            <Image
                src={imageSrc}
                alt={alt}
                width={fill ? undefined : width}
                height={fill ? undefined : height}
                fill={fill}
                quality={quality}
                priority={priority}
                sizes={sizes || (fill ? '100vw' : undefined)}
                loading={priority ? 'eager' : 'lazy'}
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k="
                className={cn(
                    'duration-700 ease-in-out',
                    isLoading ? 'scale-105 blur-sm grayscale' : 'scale-100 blur-0 grayscale-0',
                    fill ? 'object-cover' : ''
                )}
                onLoadingComplete={() => setIsLoading(false)}
                onError={() => setHasError(true)}
                onClick={onClick}
            />
        </div>
    );
}
