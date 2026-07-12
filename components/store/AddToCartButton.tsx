"use client"

import { useState } from "react"
import { useCart } from "@/context/CartContext"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, ShoppingCart } from "lucide-react"
import { cn, formatPrice } from "@/lib/utils"
import { parseDurationDays } from "@/lib/duration"

interface VariantWithStock {
  id: string
  name: string
  duration: string
  price: number
  hasWarranty?: boolean
  warrantyDays?: number | null
  stockCount?: number
}

interface Props {
  variant: VariantWithStock
  product: { id: string; name: string }
  stockCount?: number
  isBestValue?: boolean
}

export default function AddToCartButton({ variant, product, stockCount, isBestValue }: Props) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)

  const isOutOfStock = (stockCount ?? variant.stockCount ?? 1) === 0
  const days = parseDurationDays(variant.duration)
  const pricePerDay = days > 0 ? Math.round(variant.price / days) : variant.price

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
    <div className="space-y-1 relative">
      {isBestValue && (
        <div className="absolute -top-2 -right-2 z-10">
          <Badge className="text-xs bg-amber-500 hover:bg-amber-500 text-white border-0 px-1.5 py-0.5">
            ✨ Paling Worth
          </Badge>
        </div>
      )}
      <Button
        variant="outline"
        className={cn(
          "w-full justify-between",
          added && "border-green-500 text-green-600",
          isOutOfStock && "opacity-50 cursor-not-allowed",
          isBestValue && "border-amber-300 dark:border-amber-700"
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
      <div className="flex items-center justify-between px-1">
        <span className="text-xs text-muted-foreground">= {formatPrice(pricePerDay)}/hari</span>
        {!isOutOfStock && stockCount !== undefined && stockCount <= 5 && (
          <span className="text-xs text-destructive">Sisa {stockCount}</span>
        )}
      </div>
    </div>
  )
}
