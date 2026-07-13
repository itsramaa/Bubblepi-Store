"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useCart } from "@/context/CartContext"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ShoppingCart, Zap, Plus, Minus, Check,
  LayoutGrid, Table2, Shield, Star,
} from "lucide-react"
import { cn, formatPrice } from "@/lib/utils"
import { toast } from "sonner"
import { SaleCountdown } from "@/components/product/sale-countdown"

interface Variant {
  id: string
  name: string
  duration: string
  price: number
  pricePerDay: number
  stockCount: number
  hasWarranty?: boolean
  warrantyDays?: number | null
  salePrice?: number | null
  saleEndsAt?: string | Date | null
}

interface Props {
  variants: Variant[]
  product: { id: string; name: string }
  bestValueId?: string
  soldMap: Record<string, number>
}

/** Returns the effective price and whether a flash sale is active */
function getEffectivePrice(v: Variant): { effectivePrice: number; isSale: boolean } {
  if (
    v.salePrice != null &&
    (v.saleEndsAt == null || new Date(v.saleEndsAt) > new Date())
  ) {
    return { effectivePrice: v.salePrice, isSale: true }
  }
  return { effectivePrice: v.price, isSale: false }
}

export default function VariantCompareTable({ variants, product, bestValueId, soldMap }: Props) {
  const router = useRouter()
  const { addItem } = useCart()

  const [mode, setMode] = useState<"card" | "compare">("card")
  const [selectedId, setSelectedId] = useState<string>(
    // default: best value, or first in-stock, or first
    bestValueId ??
    variants.find((v) => v.stockCount > 0)?.id ??
    variants[0]?.id
  )
  const [qty, setQty] = useState(1)
  const [addedId, setAddedId] = useState<string | null>(null)

  const selected = variants.find((v) => v.id === selectedId) ?? variants[0]
  const maxQty = Math.min(selected?.stockCount ?? 0, 10)
  const isOutOfStock = !selected || selected.stockCount === 0

  function handleSelectVariant(id: string) {
    setSelectedId(id)
    setQty(1) // reset qty on variant change
  }

  function handleQty(delta: number) {
    setQty((prev) => Math.max(1, Math.min(maxQty, prev + delta)))
  }

  function handleAddToCart() {
    if (!selected || isOutOfStock) return
    const { effectivePrice } = getEffectivePrice(selected)
    addItem(
      {
        variantId: selected.id,
        productId: product.id,
        productName: product.name,
        variantName: selected.name,
        price: effectivePrice,
        duration: selected.duration,
      },
      qty
    )
    setAddedId(selected.id)
    toast.success(`${product.name} — ${selected.name} ×${qty} ditambahkan ke keranjang`)
    setTimeout(() => setAddedId(null), 2000)
  }

  function handleBuyNow() {
    if (!selected || isOutOfStock) return
    const { effectivePrice } = getEffectivePrice(selected)
    addItem(
      {
        variantId: selected.id,
        productId: product.id,
        productName: product.name,
        variantName: selected.name,
        price: effectivePrice,
        duration: selected.duration,
      },
      qty
    )
    router.push("/checkout")
  }

  return (
    <div className="space-y-5">
      {/* Header + toggle */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-base">Pilih Varian</h2>
        {variants.length > 1 && (
          <div className="flex gap-1 border rounded-lg p-1 bg-muted/30">
            <Button
              size="sm"
              variant={mode === "card" ? "default" : "ghost"}
              className="h-7 px-2 gap-1.5 text-xs"
              onClick={() => setMode("card")}
            >
              <LayoutGrid className="h-3 w-3" /> Kartu
            </Button>
            <Button
              size="sm"
              variant={mode === "compare" ? "default" : "ghost"}
              className="h-7 px-2 gap-1.5 text-xs"
              onClick={() => setMode("compare")}
            >
              <Table2 className="h-3 w-3" /> Bandingkan
            </Button>
          </div>
        )}
      </div>

      {/* Card mode — radio-style selection */}
      {mode === "card" && (
        <div className="grid grid-cols-1 gap-3">
          {variants.map((v) => {
            const isSelected = v.id === selectedId
            const isBest = v.id === bestValueId
            const sold = soldMap[v.id] ?? 0
            const oos = v.stockCount === 0
            const { effectivePrice, isSale } = getEffectivePrice(v)
            const saleEndsAtStr = v.saleEndsAt ? new Date(v.saleEndsAt).toISOString() : null

            return (
              <button
                key={v.id}
                onClick={() => !oos && handleSelectVariant(v.id)}
                disabled={oos}
                className={cn(
                  "relative w-full text-left rounded-2xl border-2 p-4 transition-all duration-200",
                  isSelected
                    ? "border-[#595B83] bg-[#595B83]/5 shadow-md"
                    : "border-border hover:border-[#595B83]/40 hover:bg-muted/20",
                  oos && "opacity-50 cursor-not-allowed"
                )}
              >
                {/* Best value ribbon */}
                {isBest && (
                  <span className="absolute -top-2.5 left-4 bg-amber-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full tracking-wide">
                    ✨ PALING WORTH
                  </span>
                )}

                {/* Flash sale ribbon */}
                {isSale && (
                  <span className="absolute -top-2.5 right-4 bg-red-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full tracking-wide">
                    🔥 FLASH SALE
                  </span>
                )}

                <div className="flex items-start gap-3">
                  {/* Radio dot */}
                  <div className={cn(
                    "mt-0.5 w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors",
                    isSelected ? "border-[#595B83] bg-[#595B83]" : "border-muted-foreground/40 bg-background"
                  )}>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-sm">{v.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{v.duration}</p>
                      </div>
                      <div className="text-right shrink-0">
                        {isSale ? (
                          <>
                            <p className="font-bold text-red-600 text-base">{formatPrice(effectivePrice)}</p>
                            <p className="text-xs text-muted-foreground line-through">{formatPrice(v.price)}</p>
                          </>
                        ) : (
                          <>
                            <p className="font-bold text-[#333456] text-base">{formatPrice(effectivePrice)}</p>
                            <p className="text-xs text-muted-foreground">{formatPrice(v.pricePerDay)}/hari</p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Flash sale countdown */}
                    {isSale && saleEndsAtStr && (
                      <div className="mt-1">
                        <SaleCountdown saleEndsAt={saleEndsAtStr} />
                      </div>
                    )}

                    {/* Badges row */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      {v.hasWarranty && v.warrantyDays && (
                        <Badge variant="secondary" className="text-[10px] gap-1 py-0">
                          <Shield className="h-2.5 w-2.5" />
                          Garansi {v.warrantyDays} hari
                        </Badge>
                      )}
                      {sold > 0 && (
                        <Badge variant="outline" className="text-[10px] gap-1 py-0">
                          <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                          {sold} terjual
                        </Badge>
                      )}
                      {isSale && v.salePrice != null && (
                        <Badge className="text-[10px] py-0 bg-red-100 text-red-700 border-red-200 hover:bg-red-100">
                          Hemat {Math.round((1 - v.salePrice / v.price) * 100)}%
                        </Badge>
                      )}
                      {oos ? (
                        <Badge variant="destructive" className="text-[10px] py-0">Habis</Badge>
                      ) : v.stockCount <= 5 ? (
                        <Badge className="text-[10px] py-0 bg-amber-500 hover:bg-amber-500">
                          Sisa {v.stockCount}
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Compare mode — table */}
      {mode === "compare" && (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-semibold">Varian</th>
                <th className="text-right px-4 py-3 font-semibold">Harga</th>
                <th className="text-right px-4 py-3 font-semibold">per Hari</th>
                <th className="text-center px-4 py-3 font-semibold">Garansi</th>
                <th className="text-center px-4 py-3 font-semibold">Stok</th>
                <th className="text-center px-4 py-3 font-semibold">Terjual</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {variants.map((v) => {
                const isBest = v.id === bestValueId
                const isSelected = v.id === selectedId
                const oos = v.stockCount === 0
                const sold = soldMap[v.id] ?? 0
                const { effectivePrice, isSale } = getEffectivePrice(v)

                return (
                  <tr
                    key={v.id}
                    className={cn(
                      "border-b last:border-0 transition-colors",
                      isBest && "bg-amber-50 dark:bg-amber-900/10",
                      isSelected && "bg-[#595B83]/5"
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium leading-tight">
                        {v.name}
                        {isBest && (
                          <span className="ml-1.5 text-[10px] bg-amber-500 text-white px-1.5 py-0.5 rounded-full font-bold">
                            ✨ Worth
                          </span>
                        )}
                        {isSale && (
                          <span className="ml-1.5 text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold">
                            🔥 Sale
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{v.duration}</div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isSale ? (
                        <div>
                          <span className="font-bold text-red-600">{formatPrice(effectivePrice)}</span>
                          <span className="block text-xs text-muted-foreground line-through">{formatPrice(v.price)}</span>
                        </div>
                      ) : (
                        <span className="font-bold">{formatPrice(effectivePrice)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground text-xs">{formatPrice(v.pricePerDay)}</td>
                    <td className="px-4 py-3 text-center">
                      {v.hasWarranty && v.warrantyDays
                        ? <Badge variant="secondary" className="text-xs">{v.warrantyDays}h</Badge>
                        : <span className="text-muted-foreground">—</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-center">
                      {oos
                        ? <span className="text-destructive font-medium text-xs">Habis</span>
                        : v.stockCount <= 5
                          ? <span className="text-amber-600 font-medium text-xs">{v.stockCount}</span>
                          : <span className="text-green-600 text-xs">{v.stockCount}</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground text-xs">{sold}</td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant={isSelected ? "default" : "outline"}
                        disabled={oos}
                        onClick={() => !oos && handleSelectVariant(v.id)}
                        className="text-xs h-8"
                      >
                        {isSelected ? <><Check className="h-3 w-3 mr-1" /> Dipilih</> : "Pilih"}
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Selected variant summary + qty stepper + CTA */}
      {selected && !isOutOfStock && (() => {
        const { effectivePrice, isSale } = getEffectivePrice(selected)
        const saleEndsAtStr = selected.saleEndsAt ? new Date(selected.saleEndsAt).toISOString() : null
        return (
          <div className="rounded-2xl border-2 border-[#595B83]/20 bg-[#595B83]/5 p-4 space-y-4">
            {/* Summary */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Dipilih</p>
                <p className="font-semibold text-sm">{selected.name} • {selected.duration}</p>
                {isSale && saleEndsAtStr && <SaleCountdown saleEndsAt={saleEndsAtStr} />}
              </div>
              <div className="text-right">
                <p className={cn("text-xl font-bold", isSale ? "text-red-600" : "text-[#333456]")}>
                  {formatPrice(effectivePrice * qty)}
                </p>
                {qty > 1 && (
                  <p className="text-xs text-muted-foreground">
                    {qty} × {formatPrice(effectivePrice)}
                  </p>
                )}
                {isSale && (
                  <p className="text-xs text-muted-foreground line-through">
                    {formatPrice(selected.price * qty)}
                  </p>
                )}
              </div>
            </div>

            {/* Qty stepper */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Jumlah</span>
              <div className="flex items-center gap-1 border rounded-xl overflow-hidden bg-background">
                <button
                  onClick={() => handleQty(-1)}
                  disabled={qty <= 1}
                  className="w-9 h-9 flex items-center justify-center hover:bg-muted disabled:opacity-40 transition-colors"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-10 text-center font-semibold text-sm tabular-nums">{qty}</span>
                <button
                  onClick={() => handleQty(1)}
                  disabled={qty >= maxQty}
                  className="w-9 h-9 flex items-center justify-center hover:bg-muted disabled:opacity-40 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {maxQty <= 5 && (
              <p className="text-xs text-amber-600 text-center">
                ⚠️ Sisa {selected.stockCount} unit — maks {maxQty} per transaksi
              </p>
            )}

            {/* CTA buttons */}
            <div className="flex gap-2 pt-1">
              <Button
                className={cn(
                  "flex-1 h-11 gap-2 font-semibold text-sm",
                  addedId === selected.id && "bg-green-600 hover:bg-green-600"
                )}
                onClick={handleAddToCart}
              >
                {addedId === selected.id ? (
                  <><Check className="h-4 w-4" /> Ditambahkan!</>
                ) : (
                  <><ShoppingCart className="h-4 w-4" /> Tambah ke Keranjang</>
                )}
              </Button>
              <Button
                variant="outline"
                className="h-11 gap-2 px-4 font-semibold text-sm border-[#595B83] text-[#595B83] hover:bg-[#595B83] hover:text-white transition-colors"
                onClick={handleBuyNow}
              >
                <Zap className="h-4 w-4" />
                Beli Langsung
              </Button>
            </div>
          </div>
        )
      })()}

      {/* Out of stock state */}
      {isOutOfStock && (
        <div className="rounded-2xl border-2 border-destructive/20 bg-destructive/5 p-4 text-center">
          <p className="text-sm font-medium text-destructive">Varian ini sedang habis stok</p>
          <p className="text-xs text-muted-foreground mt-1">Coba pilih varian lain atau hubungi admin</p>
        </div>
      )}

      {/* Sticky bottom CTA — mobile only, shown when variant selector scrolls out of view */}
      {selected && !isOutOfStock && (() => {
        const { effectivePrice, isSale } = getEffectivePrice(selected)
        return (
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t px-4 py-3 [--safe-area-inset-bottom:env(safe-area-inset-bottom)] pb-[calc(0.75rem+var(--safe-area-inset-bottom))]">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">{product.name}</p>
                <p className="text-sm font-semibold truncate">{selected.name} • {selected.duration}</p>
              </div>
              <p className={cn("font-bold shrink-0 tabular-nums", isSale ? "text-red-600" : "text-[#333456]")}>
                {formatPrice(effectivePrice * qty)}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                className={cn(
                  "flex-1 h-11 gap-2 font-semibold",
                  addedId === selected.id && "bg-green-600 hover:bg-green-600"
                )}
                onClick={handleAddToCart}
              >
                {addedId === selected.id ? (
                  <><Check className="h-4 w-4" /> Ditambahkan!</>
                ) : (
                  <><ShoppingCart className="h-4 w-4" /> Tambah ke Keranjang</>
                )}
              </Button>
              <Button
                variant="outline"
                className="h-11 px-4 border-[#595B83] text-[#595B83] hover:bg-[#595B83] hover:text-white transition-colors"
                onClick={handleBuyNow}
              >
                <Zap className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
