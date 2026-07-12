"use client"

import { useState } from "react"
import { useCart } from "@/context/CartContext"
import { Button } from "@/components/ui/button"
import { Check, ShoppingCart } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatPrice } from "@/lib/utils"

interface Props {
  variant: { id: string; name: string; duration: string; price: number }
  product: { id: string; name: string }
  stockCount?: number
}

export default function AddToCartButton({ variant, product, stockCount }: Props) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)

  const isOutOfStock = stockCount === 0

  function handleAdd() {
    if (isOutOfStock) return
    addItem({
      variantId: variant.id,
      productId: product.id,
      productName: product.name,
      variantName: variant.name,
      price: variant.price,
      duration: variant.duration,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <div className="space-y-1">
      <Button
        variant="outline"
        className={cn(
          "w-full justify-between",
          added && "border-green-500 text-green-600",
          isOutOfStock && "opacity-50 cursor-not-allowed"
        )}
        onClick={handleAdd}
        disabled={isOutOfStock}
      >
        <span>
          {variant.name} • {variant.duration}
        </span>
        <span className="flex items-center gap-2">
          {isOutOfStock ? (
            <span className="text-xs text-destructive font-medium">Habis</span>
          ) : (
            <>
              {formatPrice(variant.price)}
              {added ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4 opacity-50" />}
            </>
          )}
        </span>
      </Button>
      {!isOutOfStock && stockCount !== undefined && stockCount <= 5 && (
        <p className="text-xs text-destructive text-center">Sisa {stockCount}</p>
      )}
    </div>
  )
}
