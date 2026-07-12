"use client"

import { useCart } from "@/context/CartContext"
import { formatPrice } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Minus, Plus } from "lucide-react"
import Link from "next/link"

export default function CartPage() {
  const { items, removeItem, updateQuantity, getSubtotal, getTax, getTotal, getItemCount } = useCart()

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Keranjang Kosong</h1>
        <p className="text-muted-foreground mb-6">Belum ada item di keranjang.</p>
        <Link href="/products">
          <Button>Mulai Belanja</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Keranjang ({getItemCount()} item)</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <Card key={item.variantId}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{item.productName}</h3>
                  <p className="text-sm text-muted-foreground">{item.variantName} • {item.duration}</p>
                  <p className="text-primary font-bold">{formatPrice(item.price)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.variantId, item.quantity - 1)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center text-sm">{item.quantity}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.variantId, item.quantity + 1)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeItem(item.variantId)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Ringkasan Pesanan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{formatPrice(getSubtotal())}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Pajak (11% PPN)</span>
              <span>{formatPrice(getTax())}</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>Total</span>
              <span className="text-primary">{formatPrice(getTotal())}</span>
            </div>
            <Link href="/checkout">
              <Button className="w-full mt-4">Checkout</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
