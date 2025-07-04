// FILE: context/AppContext.tsx
// Updates:
// - getTotalPrice now calculates discounts.
"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import type { CartItem, OrderWithItems } from "@/types";
import type { User, Product as PrismaProduct } from "@prisma/client";

// Define the shape of all data and functions in our context
interface AppContextType {
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  addToCart: (product: PrismaProduct, quantity?: number) => void;
  updateCartQuantity: (productId: string, newQuantity: number) => void;
  removeFromCart: (productId: string) => void;
  getTotalPrice: () => number; // This will now be the discounted price
  getOriginalTotalPrice: () => number; // Function for the non-discounted price
  getTotalItems: () => number;
  
  currentPage: string;
  setCurrentPage: React.Dispatch<React.SetStateAction<string>>;
  selectedProduct: PrismaProduct | null;
  setSelectedProduct: React.Dispatch<React.SetStateAction<PrismaProduct | null>>;

  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  isLoadingUser: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentPage, setCurrentPage] = useState("home");
  const [selectedProduct, setSelectedProduct] = useState<PrismaProduct | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/user');
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setUser(data.user);
          }
        }
      } catch (error) {
        console.error("Failed to fetch user session", error);
      } finally {
        setIsLoadingUser(false);
      }
    };
    fetchUser();
  }, []);

  const addToCart = (product: PrismaProduct, quantity = 1) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      const newCartItem: CartItem = { ...product, quantity };
      return [...prevCart, newCartItem];
    });
  };

  const updateCartQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };
  
  const getOriginalTotalPrice = () => {
      return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  }

  const getTotalPrice = () => {
    return cart.reduce((total, item) => {
        const discount = item.discountPercentage || 0;
        const discountedPrice = item.price * (1 - discount / 100);
        return total + discountedPrice * item.quantity;
    }, 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const value: AppContextType = {
    cart,
    setCart,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    getTotalPrice,
    getOriginalTotalPrice,
    getTotalItems,
    currentPage,
    setCurrentPage,
    selectedProduct,
    setSelectedProduct,
    user,
    setUser,
    isLoadingUser,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}