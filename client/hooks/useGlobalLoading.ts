"use client";

import { useEffect } from "react";
import { loaderState } from "@/lib/loaderSignal";

export default function useGlobalLoading(loading?: boolean) {
  useEffect(() => {
    if (loading === true) {
      loaderState.start();
    } else if (loading === false) {
      loaderState.complete();
    }
  }, [loading]);

  return {
    start: loaderState.start,
    stop: loaderState.complete, // 'complete' is usually safer than strict 'stop' for bars
  };
}
