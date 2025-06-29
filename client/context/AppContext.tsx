// FILE: context/AppContext.tsx (Final and Corrected Version)
"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import type { CartItem, OrderWithItems } from "@/types";
import type { User, Product as PrismaProduct } from "@prisma/client";

// Define the shape of all data and functions in our context
interface AppContextType {
  // Cart State and Functions
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  addToCart: (product: PrismaProduct, quantity?: number) => void;
  updateCartQuantity: (productId: string, newQuantity: number) => void;
  removeFromCart: (productId: string) => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
  
  // Navigation State (for single-page navigation model)
  currentPage: string;
  setCurrentPage: React.Dispatch<React.SetStateAction<string>>;
  selectedProduct: PrismaProduct | null;
  setSelectedProduct: React.Dispatch<React.SetStateAction<PrismaProduct | null>>;

  // Authentication State
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  isLoadingUser: boolean;
}

// Create the context with an initial undefined value
const AppContext = createContext<AppContextType | undefined>(undefined);

// Create the Provider component which will wrap our entire app
export function AppProvider({ children }: { children: ReactNode }) {
  // --- All our global states are defined here ---
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentPage, setCurrentPage] = useState("home");
  const [selectedProduct, setSelectedProduct] = useState<PrismaProduct | null>(null);
  const [user, setUser] = useState<User | null>(null); // Initially, no user is logged in
  const [isLoadingUser, setIsLoadingUser] = useState(true); // Start with loading true

  // Effect to fetch user session on initial app load
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

  // --- All our global functions are defined here ---

  const addToCart = (product: PrismaProduct, quantity = 1) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      // CORRECT: Create a new CartItem by spreading the product (which has a number price) and adding quantity
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

  const getTotalPrice = () => {
    // CORRECT: 'item.price' is now a number, so this calculation works perfectly.
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
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

// Custom hook for easy access to the context
export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}