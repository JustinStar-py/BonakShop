// FILE: context/AppContext.tsx
// DESCRIPTION: Manages the global state of the application including user authentication,
// shopping cart, and page navigation. Adapted to handle JWT-based authentication.

"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import type { CartItem } from "@/types";
import type { User, Product as PrismaProduct } from "@prisma/client";
import apiClient from "@/lib/apiClient"; // Import our new API client

// Define the shape of all data and functions in our context
interface AppContextType {
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  addToCart: (product: PrismaProduct, quantity?: number) => void;
  updateCartQuantity: (productId: string, newQuantity: number) => void;
  removeFromCart: (productId: string) => void;
  getTotalPrice: () => number;
  getOriginalTotalPrice: () => number;
  getTotalItems: () => number;
  
  currentPage: string;
  setCurrentPage: React.Dispatch<React.SetStateAction<string>>;
  selectedProduct: PrismaProduct | null;
  setSelectedProduct: React.Dispatch<React.SetStateAction<PrismaProduct | null>>;

  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  login: (userData: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  isLoadingUser: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentPage, setCurrentPage] = useState("home");
  const [selectedProduct, setSelectedProduct] = useState<PrismaProduct | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // --- START: JWT Authentication Logic ---
  // This effect runs once when the app starts.
  useEffect(() => {
    const checkUserSession = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          // If a token exists, try to fetch the user profile.
          // The apiClient will automatically handle authorization header.
          const response = await apiClient.get('/auth/user');
          if (response.data.user) {
            setUser(response.data.user);
          }
        } catch (error) {
          console.error("Session check failed:", error);
          // If token is invalid (e.g., expired), logout will be triggered by apiClient interceptor.
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }
      setIsLoadingUser(false);
    };
    checkUserSession();
  }, []);

  // Function to handle successful login
  const login = (userData: User, accessToken: string, refreshToken: string) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    setUser(userData);
  };

  // Function to handle logout
  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    // Optionally, you can call the backend logout to invalidate session on server too
    // apiClient.post('/auth/logout');
  };
  // --- END: JWT Authentication Logic ---

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
    setUser, // Keep setUser for direct manipulation if needed
    login,
    logout,
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