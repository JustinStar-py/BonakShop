"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type MainErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function MainError({ error, reset }: MainErrorProps) {
  useEffect(() => {
    console.error("Main segment error:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] px-4 flex flex-col items-center justify-center gap-4 text-center">
      <h2 className="text-xl font-bold text-gray-800">مشکلی پیش آمد</h2>
      <p className="text-sm text-gray-500">لطفا دوباره تلاش کنید یا بعدا برگردید.</p>
      <div className="flex flex-col sm:flex-row gap-2">
        <Button onClick={reset}>تلاش دوباره</Button>
        <Button asChild variant="outline">
          <Link href="/">بازگشت به خانه</Link>
        </Button>
      </div>
    </div>
  );
}
