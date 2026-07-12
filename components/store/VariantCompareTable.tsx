"use client"

import { useState } from "react"
import AddToCartButton from "./AddToCartButton"
import { formatPrice } from "@/lib/utils"
import { LayoutGrid, Table2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Variant {
  id: string
  name: string
  duration: string
  price: number
  pricePerDay: number
  stockCount: number
  hasWarranty?: boolean
  warrantyDays?: number | null
}

interface Props {
  variants: Variant[]
  product: { id: string; name: string }
  bestValueId?: string
  soldMap: Record<string, number>
}

export default function VariantCompareTable({ variants, product, bestValueId, soldMap }: Props) {
  const [mode, setMode] = useState<"card" | "compare">("card")

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Pilih Varian:</h2>
        {variants.length > 1 && (
          <div className="flex gap-1 border rounded-lg p-1">
            <Button size="sm" variant={mode === "card" ? "default" : "ghost"} className="h-7 px-2 gap-1.5 text-xs" onClick={() => setMode("card")}>
              <LayoutGrid className="h-3 w-3" /> Kartu
            </Button>
            <Button size="sm" variant={mode === "compare" ? "default" : "ghost"} className="h-7 px-2 gap-1.5 text-xs" onClick={() => setMode("compare")}>
              <Table2 className="h-3 w-3" /> Bandingkan
            </Button>
          </div>
        )}
      </div>

      {mode === "card" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {variants.map((v) => (
            <AddToCartButton key={v.id} variant={v} product={product} stockCount={v.stockCount} isBestValue={v.id === bestValueId} />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-semibold">Varian</th>
                <th className="text-right px-4 py-3 font-semibold">Harga</th>
                <th className="text-right px-4 py-3 font-semibold">Harga/Hari</th>
                <th className="text-right px-4 py-3 font-semibold">Garansi</th>
                <th className="text-right px-4 py-3 font-semibold">Stok</th>
                <th className="text-right px-4 py-3 font-semibold">Terjual</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {variants.map((v) => (
                <tr key={v.id} className={`border-b last:border-0 ${v.id === bestValueId ? "bg-amber-50 dark:bg-amber-900/10" : ""}`}>
                  <td className="px-4 py-3 font-medium">
                    {v.name}
                    {v.id === bestValueId && <span className="ml-2 text-xs text-amber-600">✨ Worth</span>}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{formatPrice(v.price)}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{formatPrice(v.pricePerDay)}</td>
                  <td className="px-4 py-3 text-right">{v.hasWarranty ? `${v.warrantyDays}h` : "—"}</td>
                  <td className="px-4 py-3 text-right">{v.stockCount > 0 ? v.stockCount : <span className="text-destructive">Habis</span>}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{soldMap[v.id] ?? 0}</td>
                  <td className="px-4 py-3 min-w-[160px]">
                    <AddToCartButton variant={v} product={product} stockCount={v.stockCount} isBestValue={v.id === bestValueId} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
