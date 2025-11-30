"use client";

import { useEffect, useRef } from "react";
import LoadingBar, { LoadingBarRef } from "react-top-loading-bar";
import { loaderState } from "@/lib/loaderSignal";
import { usePathname, useSearchParams } from "next/navigation";

export default function GlobalLoader() {
  const ref = useRef<LoadingBarRef>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 1. Listen to Route Changes
  useEffect(() => {
    // When route changes, we complete the bar.
    // Note: Next.js App Router doesn't have "routeChangeStart", 
    // so we rely on API calls or manual triggers for the "Start" of navigation
    // usually handled by data fetching hooks.
    ref.current?.complete();
  }, [pathname, searchParams]);

  // 2. Listen to Global Loader Signals (API calls, manual hooks)
  useEffect(() => {
    const unsubscribe = loaderState.subscribe((event) => {
      if (event === 'start') ref.current?.continuousStart();
      if (event === 'stop') ref.current?.complete(); // 'stop' in bar terms often means complete or hide
      if (event === 'complete') ref.current?.complete();
    });
    return unsubscribe;
  }, []);

  return (
    <LoadingBar
      ref={ref}
      color="var(--color-primary)" // Uses your theme variable
      height={3}
      shadow={false}
      className="z-[100]" // Ensure it's on top of everything
    />
  );
}
