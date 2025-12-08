// FILE: hooks/useInfiniteScroll.ts
// DESCRIPTION: Optimized infinite scroll hook with Intersection Observer

import { useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollOptions {
    onLoadMore: () => void;
    hasMore: boolean;
    isLoading: boolean;
    threshold?: number;
    rootMargin?: string;
}

export default function useInfiniteScroll({
    onLoadMore,
    hasMore,
    isLoading,
    threshold = 0.1,
    rootMargin = '100px',
}: UseInfiniteScrollOptions) {
    const observerTarget = useRef<HTMLDivElement>(null);

    const handleObserver = useCallback(
        (entries: IntersectionObserverEntry[]) => {
            const [entry] = entries;

            if (entry.isIntersecting && hasMore && !isLoading) {
                onLoadMore();
            }
        },
        [hasMore, isLoading, onLoadMore]
    );

    useEffect(() => {
        const element = observerTarget.current;
        if (!element) return;

        const observer = new IntersectionObserver(handleObserver, {
            threshold,
            rootMargin,
        });

        observer.observe(element);

        return () => {
            if (element) {
                observer.unobserve(element);
            }
        };
    }, [handleObserver, threshold, rootMargin]);

    return { observerTarget };
}
