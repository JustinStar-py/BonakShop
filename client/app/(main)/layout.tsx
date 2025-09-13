// FILE: app/(main)/layout.tsx
"use client";

import BottomNavigation from "@/components/layout/BottomNavigation";
import { useAppContext } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoadingUser, getTotalItems } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    // اگر بارگذاری تمام شده و کاربری وجود ندارد، به صفحه لاگین هدایت کن
    if (!isLoadingUser && !user) {
      router.replace("/auth");
    }
  }, [user, isLoadingUser, router]);

  // تا زمانی که وضعیت احراز هویت مشخص نشده، یک اسپینر لودینگ نمایش بده
  if (isLoadingUser) {
    return <LoadingSpinner message="در حال بررسی اطلاعات کاربری..." />;
  }

  // اگر کاربر لاگین کرده بود، محتوای صفحه را به همراه نویگیشن نمایش بده
  if (user) {
    return (
      <div className="pb-20">
        {children}
        <BottomNavigation totalCartItems={getTotalItems()} />
      </div>
    );
  }

  return null;
}