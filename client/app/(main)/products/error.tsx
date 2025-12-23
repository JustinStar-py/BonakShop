"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type ProductsErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ProductsError({ error, reset }: ProductsErrorProps) {
  useEffect(() => {
    console.error("Products page error:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] px-4 flex flex-col items-center justify-center gap-4 text-center">
      <h2 className="text-xl font-bold text-gray-800">خطا در بارگذاری محصولات</h2>
      <p className="text-sm text-gray-500">لطفا دوباره تلاش کنید.</p>
      <div className="flex flex-col sm:flex-row gap-2">
        <Button onClick={reset}>تلاش دوباره</Button>
        <Button asChild variant="outline">
          <Link href="/">بازگشت به خانه</Link>
        </Button>
      </div>
    </div>
  );
}
