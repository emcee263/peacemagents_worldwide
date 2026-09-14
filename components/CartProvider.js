"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  readCart,
  writeCart,
  getCartCount,
  getCartSubtotal,
} from "../lib/cart";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);

  useEffect(() => {
    setCart(readCart());

    const handleCartUpdate = () => {
      setCart(readCart());
    };

    window.addEventListener("cart-updated", handleCartUpdate);

    return () => {
      window.removeEventListener("cart-updated", handleCartUpdate);
    };
  }, []);

  function addItem(item) {
    setCart((current) => {
      const existing = current.find(
        (entry) =>
          entry.productId === item.productId &&
          entry.variantId === item.variantId
      );

      let next;

      if (existing) {
        const stock = Number(existing.stock || item.stock || 0);
        const requestedQuantity =
          Number(existing.quantity || 0) + Number(item.quantity || 0);

        const quantity =
          stock > 0
            ? Math.min(requestedQuantity, stock)
            : requestedQuantity;

        next = current.map((entry) =>
          entry.productId === item.productId &&
          entry.variantId === item.variantId
            ? {
                ...entry,
                quantity,
              }
            : entry
        );
      } else {
        const stock = Number(item.stock || 0);

        if (stock <= 0) {
          return current;
        }

        next = [
          ...current,
          {
            ...item,
            quantity: Math.min(Number(item.quantity || 1), stock),
          },
        ];
      }

      writeCart(next);
      return next;
    });
  }

  function updateQuantity(productId, variantId, quantity) {
    setCart((current) => {
      const next = current
        .map((item) => {
          if (
            item.productId !== productId ||
            item.variantId !== variantId
          ) {
            return item;
          }

          const stock = Number(item.stock || 0);
          const requested = Number(quantity || 0);

          if (requested <= 0) {
            return null;
          }

          return {
            ...item,
            quantity:
              stock > 0 ? Math.min(requested, stock) : requested,
          };
        })
        .filter(Boolean);

      writeCart(next);
      return next;
    });
  }

  function removeItem(productId, variantId) {
    setCart((current) => {
      const next = current.filter(
        (item) =>
          !(
            item.productId === productId &&
            item.variantId === variantId
          )
      );

      writeCart(next);
      return next;
    });
  }

  function clearCart() {
    setCart([]);
    writeCart([]);
  }

  const value = useMemo(
    () => ({
      cart,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      cartCount: getCartCount(cart),
      subtotal: getCartSubtotal(cart),
    }),
    [cart]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
}
