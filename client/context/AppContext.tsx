// FILE: context/AppContext.tsx (FIXED)
"use client";

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
import type { CartItem, User } from "@/types"; // <-- User هم از types وارد شد
import type { Product as PrismaProduct } from "@prisma/client";
import apiClient from "@/lib/apiClient";

// تعریف ساختار داده‌ها و توابع در Context
interface AppContextType {
    cart: CartItem[];
    addToCart: (product: PrismaProduct, quantity?: number) => void;
    updateCartQuantity: (productId: string, newQuantity: number) => void;
    updateCartPricing: (productId: string, newPrice: number, newDiscountPercentage?: number) => void;
    removeFromCart: (productId: string) => void;
    clearCart: () => void;
    getTotalPrice: () => number;
    getOriginalTotalPrice: () => number;
    getTotalItems: () => number;

    user: User | null;
    setUser: (user: User | null) => void;
    login: (phone: string, password?: string, tokens?: { accessToken: string; refreshToken: string; user: User }) => Promise<boolean>;
    logout: () => void;
    isLoadingUser: boolean;
    error: string | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [isLoadingUser, setIsLoadingUser] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const checkUserSession = async () => {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                setIsLoadingUser(false);
                return;
            }
            try {
                const response = await apiClient.get('/auth/user');
                setUser(response.data.user);
            } catch (e) {
                console.error("Session check failed, logging out.", e);
                setUser(null);
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
            } finally {
                setIsLoadingUser(false);
            }
        };

        checkUserSession();
    }, []);


    const login = async (phone: string, password?: string, tokens?: { accessToken: string; refreshToken: string; user: User }): Promise<boolean> => {
        setIsLoadingUser(true);
        setError(null);
        try {
            if (tokens) {
                localStorage.setItem('accessToken', tokens.accessToken);
                localStorage.setItem('refreshToken', tokens.refreshToken);
                setUser(tokens.user);
                return true;
            } else {
                const response = await apiClient.post('/auth/login', { phone, password });
                const { user, accessToken, refreshToken } = response.data;
                localStorage.setItem('accessToken', accessToken);
                localStorage.setItem('refreshToken', refreshToken);
                setUser(user);
                return true;
            }
        } catch (err: any) {
            setError(err.response?.data?.error || "خطای ورود");
            return false;
        } finally {
            setIsLoadingUser(false);
        }
    };

    const logout = async () => {
        try {
            await apiClient.post('/auth/logout');
        } catch (e) {
            console.error("Logout API call failed, clearing local data anyway.", e);
        } finally {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            setUser(null);
            setCart([]);
        }
    };

    const addToCart = (product: PrismaProduct, quantity = 1) => {
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

    const updateCartPricing = (productId: string, newPrice: number, newDiscountPercentage?: number) => {
        setCart((prevCart) =>
            prevCart.map((item) =>
                item.id === productId
                    ? { 
                        ...item, 
                        price: newPrice, 
                        discountPercentage: newDiscountPercentage ?? item.discountPercentage ?? 0 
                    }
                    : item
            )
        );
    };

    const removeFromCart = (productId: string) => {
        setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
    };

    const clearCart = () => {
        setCart([]);
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
        addToCart,
        updateCartQuantity,
        updateCartPricing,
        removeFromCart,
        clearCart,
        getTotalPrice,
        getOriginalTotalPrice,
        getTotalItems,
        user,
        setUser,
        login,
        logout,
        isLoadingUser,
        error,
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
