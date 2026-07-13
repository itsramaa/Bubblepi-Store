"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import type { CartItem } from "@/types"

interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void
  removeItem: (variantId: string) => void
  updateQuantity: (variantId: string, quantity: number) => void
  clearCart: () => void
  getSubtotal: () => number
  getTotal: () => number
  getItemCount: () => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  useEffect(() => {
    try {
      const saved = localStorage.getItem("cart")
      if (saved) setItems(JSON.parse(saved))
    } catch {
      localStorage.removeItem("cart")
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem("cart", JSON.stringify(items))
    } catch {}
  }, [items])

  const addItem = useCallback((newItem: Omit<CartItem, "quantity">, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.variantId === newItem.variantId)
      if (existing) {
        return prev.map((i) =>
          i.variantId === newItem.variantId
            ? { ...i, quantity: i.quantity + quantity }
            : i
        )
      }
      return [...prev, { ...newItem, quantity }]
    })
  }, [])

  const removeItem = useCallback((variantId: string) => {
    setItems((prev) => prev.filter((i) => i.variantId !== variantId))
  }, [])

  const updateQuantity = useCallback((variantId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.variantId !== variantId))
      return
    }
    setItems((prev) =>
      prev.map((i) => (i.variantId === variantId ? { ...i, quantity } : i))
    )
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const getSubtotal = useCallback(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items]
  )

  // ponytail: no tax — total = subtotal only. Add Xendit fee display in checkout, not here.
  const getTotal = useCallback(() => getSubtotal(), [getSubtotal])

  const getItemCount = useCallback(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  )

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getSubtotal,
        getTotal,
        getItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart must be used within CartProvider")
  return ctx
}
