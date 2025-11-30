"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '@/context/AppContext';
import apiClient from '@/lib/apiClient';

export type CartChange = {
  productId: string;
  productName?: string;
  type: 'REMOVED' | 'UNAVAILABLE' | 'OUT_OF_STOCK' | 'INSUFFICIENT_STOCK' | 'PRICE_CHANGED';
  message: string;
  action: 'remove' | 'update_quantity' | 'update_price';
  newStock?: number;
  newPrice?: number;
  newDiscountPercentage?: number;
  newFinalPrice?: number;
};

export function useCartValidator() {
  const { cart, removeFromCart, updateCartQuantity, updateCartPricing } = useAppContext();
  const [changes, setChanges] = useState<CartChange[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  const validateCart = useCallback(async () => {
    if (cart.length === 0) return;

    setIsValidating(true);
    try {
      // Prepare payload: id, quantity, and price (to check for changes)
      const payload = cart.map(item => ({
        id: item.id,
        quantity: item.quantity,
        price: item.price,
        discountPercentage: item.discountPercentage
      }));

      const res = await apiClient.post('/api/cart/validate', { items: payload });
      
      setChanges(res.data.valid ? [] : res.data.changes || []);
    } catch (error) {
      console.error("Cart validation failed:", error);
    } finally {
      setIsValidating(false);
    }
  }, [cart]);

  // Auto-validate every 60 seconds
  useEffect(() => {
    if (cart.length === 0) return;

    const intervalId = setInterval(() => {
      validateCart();
    }, 60 * 1000); // 1 minute

    return () => clearInterval(intervalId);
  }, [cart, validateCart]);

  const applyChanges = () => {
    changes.forEach(change => {
      if (change.action === 'remove') {
        removeFromCart(change.productId);
      } else if (change.action === 'update_quantity' && change.newStock !== undefined) {
        updateCartQuantity(change.productId, change.newStock);
      } else if (change.action === 'update_price' && change.newPrice !== undefined) {
        updateCartPricing(change.productId, change.newPrice, change.newDiscountPercentage);
      }
    });
    setChanges([]);
  };

  const clearChanges = () => setChanges([]);

  return {
    changes,
    isValidating,
    validateCart,
    applyChanges,
    clearChanges
  };
}
