import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ProductNotFound() {
  return (
    <div className="min-h-[70vh] px-4 flex flex-col items-center justify-center gap-4 text-center">
      <h2 className="text-xl font-bold text-gray-800">محصول مورد نظر یافت نشد</h2>
      <p className="text-sm text-gray-500">احتمالا محصول حذف شده یا آدرس اشتباه است.</p>
      <div className="flex flex-col sm:flex-row gap-2">
        <Button asChild>
          <Link href="/products">بازگشت به محصولات</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">بازگشت به خانه</Link>
        </Button>
      </div>
    </div>
  );
}
