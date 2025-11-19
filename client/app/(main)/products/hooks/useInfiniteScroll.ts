import { useEffect } from 'react';
import { SCROLL_THRESHOLD } from '../constants';

export function useInfiniteScroll(
  callback: () => void,
  isLoading: boolean,
  hasMore: boolean
) {
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - SCROLL_THRESHOLD &&
        !isLoading &&
        hasMore
      ) {
        callback();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [callback, isLoading, hasMore]);
}
