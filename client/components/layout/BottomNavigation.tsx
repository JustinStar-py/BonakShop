// FILE: components/layout/BottomNavigation.tsx (Final and Complete Version)
"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Home, List, ShoppingCart, History } from "lucide-react"; // Import History icon

// Define the types for the component's props
interface BottomNavigationProps {
  currentPage: string;
  totalCartItems: number;
  onNavigate: (page: string) => void;
  onNavigateToCategories: () => void;
}

export default function BottomNavigation({
  currentPage,
  totalCartItems,
  onNavigate,
  onNavigateToCategories
}: BottomNavigationProps) {

  // Helper function to determine button style based on the current page
  const getButtonClass = (page: string) => {
    const baseClass = "flex flex-col items-center h-16 px-6 rounded-2xl transition-all duration-200";
    // add 0.5 secends of transition for smooth animation
    const activeClass = "bg-green-600 text-white w-[30vw]";
    const inactiveClass = "text-green-700 w-[15vw]";
    return `${baseClass} ${currentPage === page ? activeClass : inactiveClass}`;
  };

  const getVariant = (page: string) => (currentPage === page ? 'default' : 'ghost');

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-green-100 p-2 flex justify-around shadow-lg z-99">
      
      {/* Home Button */}
      <Button
        variant={getVariant("home")}
        className={getButtonClass("home")}
        onClick={() => onNavigate("home")}
      >
        <Home className="h-6 w-6" />
        <span className="text-xs mt-1 font-800">خانه</span>
      </Button>

      {/* Products/Categories Button */}
      <Button
        variant={getVariant("category")}
        className={getButtonClass("category")}
        onClick={onNavigateToCategories}
      >
        <List className="h-6 w-6" />
        <span className="text-xs mt-1 font-800">محصولات</span>
      </Button>

      {/* Order History Button */}
      <Button
        variant={getVariant("order_history")}
        className={getButtonClass("order_history")}
        onClick={() => onNavigate("order_history")}
      >
        <History className="h-6 w-6" />
        <span className="text-xs mt-1 font-800">تاریخچه</span>
      </Button>

      {/* Shopping Cart Button */}
      <Button
        variant={getVariant("cart")}
        className={`${getButtonClass("cart")} relative`}
        onClick={() => onNavigate("cart")}
      >
        <ShoppingCart className="h-6 w-6" />
        <span className="text-xs mt-1 font-800">سبد خرید</span>
        {totalCartItems > 0 && (
          <Badge className="absolute -top-1 -right-1 h-6 w-6 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
            {totalCartItems}
          </Badge>
        )}
      </Button>
    </nav>
  );
}