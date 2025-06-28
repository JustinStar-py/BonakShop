// FILE: context/AppContext.tsx (Final and Complete Version)
"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import type { Product, CartItem } from "@/types";
import type { User } from "@prisma/client";

// Define the shape of all data and functions in our context
interface AppContextType {
  // Cart State and Functions
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  addToCart: (product: Product, quantity?: number) => void;
  updateCartQuantity: (productId: number, newQuantity: number) => void;
  removeFromCart: (productId: number) => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
  
  // Navigation State (for single-page navigation model)
  currentPage: string;
  setCurrentPage: React.Dispatch<React.SetStateAction<string>>;
  selectedProduct: Product | null;
  setSelectedProduct: React.Dispatch<React.SetStateAction<Product | null>>;

  // Authentication State
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  isLoadingUser: boolean; // To show a loading state while checking session
}

// Create the context with an initial undefined value
const AppContext = createContext<AppContextType | undefined>(undefined);

// Create the Provider component which will wrap our entire app
export function AppProvider({ children }: { children: ReactNode }) {
  // --- All our global states are defined here ---
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentPage, setCurrentPage] = useState("home");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [user, setUser] = useState<User | null>(null); // Initially, no user is logged in
  const [isLoadingUser, setIsLoadingUser] = useState(true); // Start with loading true

  // This effect runs once when the app loads to check for an existing session
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
        setIsLoadingUser(false); // Stop loading after the check is complete
      }
    };

    fetchUser();
  }, []); // The empty dependency array ensures this runs only once

  // --- All our global functions are defined here ---

  const addToCart = (product: Product, quantity = 1) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevCart, { ...product, quantity }];
    });
  };

  const updateCartQuantity = (productId: number, newQuantity: number) => {
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

  const removeFromCart = (productId: number) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.priceNumber * item.quantity, 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  // The value object holds everything we want to expose to our components
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

// Create a custom hook for easy access to the context in any component
export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}