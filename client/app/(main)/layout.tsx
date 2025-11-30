// FILE: app/(main)/layout.tsx (FINAL CORRECTED LOGIC)
"use client";

import BottomNavigation from "@/components/layout/BottomNavigation";
import { useAppContext } from "@/context/AppContext";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { useCartValidator } from "@/hooks/useCartValidator";
import CartValidationModal from "@/components/shared/CartValidationModal";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoadingUser, getTotalItems } = useAppContext();
  const router = useRouter();
  const pathname = usePathname();
  
  // Integrate Cart Validator
  const { changes, applyChanges, clearChanges } = useCartValidator();

  useEffect(() => {
    if (isLoadingUser) {
      return; // Wait until user loading is complete
    }

    if (!user) {
      router.replace("/auth");
      return;
    }
    
    // --- UPDATED LOGIC with new URL ---
    const isProfileIncomplete = !user.name || !user.shopName;
    const completeProfilePath = "/profile/complete"; // New path

    if (isProfileIncomplete && pathname !== completeProfilePath) {
      router.replace(completeProfilePath);
    }
    
    if (!isProfileIncomplete && pathname === completeProfilePath) {
        router.replace("/");
    }

  }, [user, isLoadingUser, router, pathname]);

  if (isLoadingUser) {
    return <LoadingSpinner message="در حال بررسی اطلاعات کاربری..." />;
  }

  const isProfileIncomplete = user && (!user.name || !user.shopName);
  const isOnCompleteProfilePage = pathname === "/profile/complete";


  if (isProfileIncomplete && isOnCompleteProfilePage) {
      return <>{children}</>;
  }
  
  if (isProfileIncomplete) {
      return <LoadingSpinner message="در حال انتقال به صفحه تکمیل اطلاعات..." />;
  }

  // If the user is fully authenticated and has a complete profile, show the main app layout.
  if (user) {
    return (
      <div className="pb-20">
        {children}
        <BottomNavigation totalCartItems={getTotalItems()} />
        
        {/* Cart Validation Modal - Global Check */}
        <CartValidationModal 
          open={changes.length > 0}
          changes={changes}
          onConfirm={applyChanges}
          onCancel={clearChanges}
        />
      </div>
    );
  }

  // Fallback, should not be reached.
  return null;
}

