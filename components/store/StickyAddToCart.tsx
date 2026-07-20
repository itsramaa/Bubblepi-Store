"use client"

import { useEffect, useState } from "react"
import { useCart } from "@/context/CartContext"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Zap } from "lucide-react"
import { cn, formatPrice } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface Variant {
  id: string
  name: string
  duration?: string
  price: number
  stockCount: number
}

interface Props {
  product: { id: string; name: string }
  selectedVariant: Variant
  quantity: number
}

export default function StickyAddToCart({ product, selectedVariant, quantity }: Props) {
  const { addItem } = useCart()
  const router = useRouter()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0.1 }
    )
    const target = document.getElementById("variant-selector-anchor")
    if (target) observer.observe(target)
    return () => observer.disconnect()
  }, [])

  const isOos = selectedVariant.stockCount === 0

  function handleAdd() {
    if (isOos) return
    addItem({
      variantId: selectedVariant.id,
      productId: product.id,
      productName: product.name,
      variantName: selectedVariant.name,
      price: selectedVariant.price,
    }, quantity)
    toast.success(`${selectedVariant.name} ditambahkan ke keranjang`)
  }

  function handleBuyNow() {
    if (isOos) return
    addItem({
      variantId: selectedVariant.id,
      productId: product.id,
      productName: product.name,
      variantName: selectedVariant.name,
      price: selectedVariant.price,
    }, quantity)
    router.push("/checkout")
  }

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-50 md:hidden transition-transform duration-300 ease-in-out",
      visible ? "translate-y-0" : "translate-y-full"
    )}>
      <div className="bg-background/95 backdrop-blur-md border-t px-4 py-3 safe-area-pb">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground truncate">{product.name}</p>
            <p className="text-sm font-semibold truncate">{selectedVariant.name} • {selectedVariant.name}</p>
          </div>
          <p className="font-bold text-[#333456] shrink-0">{formatPrice(selectedVariant.price * quantity)}</p>
        </div>
        <div className="flex gap-2">
          <Button
            className="flex-1 h-11 gap-2 font-semibold"
            onClick={handleAdd}
            disabled={isOos}
          >
            <ShoppingCart className="h-4 w-4" />
            Tambah ke Keranjang
          </Button>
          <Button
            variant="outline"
            className="h-11 gap-2 px-4 font-semibold border-[#595B83] text-[#595B83] hover:bg-[#595B83] hover:text-white"
            onClick={handleBuyNow}
            disabled={isOos}
          >
            <Zap className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
