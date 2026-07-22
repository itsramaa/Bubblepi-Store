"use client"

import { useState } from "react"
import { useCart } from "@/context/CartContext"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Check } from "lucide-react"
import { cn, formatPrice } from "@/lib/utils"
import { toast } from "sonner"

interface Variant {
  id: string
  name: string
  duration?: string
  price: number
  hasWarranty?: boolean
  warrantyDays?: number | null
  stockCount?: number
}

interface Props {
  variant: Variant
  product: { id: string; name: string }
  stockCount?: number
  isBestValue?: boolean
}

export default function AddToCartButton({ variant, product, stockCount, isBestValue }: Props) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)

  const stock = stockCount ?? 0
  const isOutOfStock = stock === 0

  function handleAdd() {
    if (isOutOfStock) return
    addItem({
      variantId: variant.id,
      productId: product.id,
      productName: product.name,
      variantName: variant.name,
      price: variant.price,
    })
    setAdded(true)
    toast.success(`${variant.name} ditambahkan ke keranjang`)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <div className="space-y-1 relative">
      {isBestValue && (
        <div className="absolute -top-2 -right-2 z-10">
          <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 text-[11px] font-semibold px-2.5 py-0.5 border border-amber-200">
            ✨ Paling Worth
          </span>
        </div>
      )}
      <Button
        variant="outline"
        className={cn(
          "w-full justify-between rounded-sm border-hairline text-body-sm font-medium h-auto py-3",
          added && "border-green-500 text-green-600",
          isOutOfStock && "opacity-50 cursor-not-allowed",
          isBestValue && "border-amber-300"
        )}
        onClick={handleAdd}
        disabled={isOutOfStock}
      >
        <span>{variant.name}</span>
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
      <div className="flex items-center justify-between px-1">
        {variant.duration && (
          <span className="text-caption-sm text-muted">/{variant.duration}</span>
        )}
        {!isOutOfStock && stock <= 5 && (
          <span className="text-caption-sm text-destructive">Sisa {stock}</span>
        )}
      </div>
    </div>
  )
}