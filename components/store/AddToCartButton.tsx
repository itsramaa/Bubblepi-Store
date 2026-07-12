"use client"

import { useState } from "react"
import { useCart } from "@/context/CartContext"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatPrice } from "@/lib/utils"

interface Props {
  variant: { id: string; name: string; duration: string; price: number }
  product: { id: string; name: string }
}

export default function AddToCartButton({ variant, product }: Props) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)

  function handleAdd() {
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
    <Button
      variant="outline"
      className={cn(
        "w-full justify-between",
        added && "border-success text-success"
      )}
      onClick={handleAdd}
    >
      <span>
        {variant.name} • {variant.duration}
      </span>
      <span className="flex items-center gap-2">
        {formatPrice(variant.price)}
        {added ? <Check className="h-4 w-4" /> : null}
      </span>
    </Button>
  )
}
