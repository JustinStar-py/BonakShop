"use client";

import { useEffect, useRef, Suspense } from "react";
import LoadingBar, { LoadingBarRef } from "react-top-loading-bar";
import { loaderState } from "@/lib/loaderSignal";
import { usePathname, useSearchParams } from "next/navigation";

function GlobalLoaderContent() {
  const ref = useRef<LoadingBarRef>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 1. Listen to Route Changes
  useEffect(() => {
    // When route changes, we complete the bar.
    ref.current?.complete();
  }, [pathname, searchParams]);

  // 2. Listen to Global Loader Signals (API calls, manual hooks)
  useEffect(() => {
    const unsubscribe = loaderState.subscribe((event) => {
      if (event === 'start') ref.current?.continuousStart();
      if (event === 'stop') ref.current?.complete(); 
      if (event === 'complete') ref.current?.complete();
    });
    return unsubscribe;
  }, []);

  return (
    <LoadingBar
      ref={ref}
      color="var(--color-primary)" 
      height={3}
      shadow={false}
      className="z-[100]"
    />
  );
}

export default function GlobalLoader() {
  return (
    <Suspense fallback={null}>
      <GlobalLoaderContent />
    </Suspense>
  );
}
