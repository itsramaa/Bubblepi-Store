/**
 * Admin Manual Order Creation
 */

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Loader2, ShoppingBag, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { goAPI } from "@/lib/api-client"

interface Product {
  id: string
  name: string
  variants: Array<{ id: string; name: string; price: number }>
}

interface OrderItem {
  variantId: string
  quantity: number
}

export default function ManualOrderPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    notes: "",
  })
  const [items, setItems] = useState<OrderItem[]>([{ variantId: "", quantity: 1 }])

  useEffect(() => {
    fetch(goAPI("/api/admin/products"), { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setProducts(d.data ?? d.products ?? d))
      .catch(() => toast.error("Gagal memuat produk"))
      .finally(() => setLoading(false))
  }, [])

  function addItem() {
    setItems([...items, { variantId: "", quantity: 1 }])
  }

  function removeItem(i: number) {
    setItems(items.filter((_, idx) => idx !== i))
  }

  function updateItem(i: number, field: keyof OrderItem, value: string | number) {
    setItems(items.map((item, idx) => (idx === i ? { ...item, [field]: value } : item)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Validate
    if (!form.customerName.trim() || !form.customerEmail.trim()) {
      toast.error("Nama dan email pelanggan harus diisi")
      return
    }

    const validItems = items.filter((i) => i.variantId)
    if (validItems.length === 0) {
      toast.error("Pilih minimal satu varian produk")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(goAPI("/api/admin/orders/manual"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.customerName,
          customerEmail: form.customerEmail,
          notes: form.notes || undefined,
          items: validItems.map((i) => ({
            variantId: i.variantId,
            quantity: i.quantity,
          })),
        }),
        credentials: "include",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Gagal membuat pesanan")

      toast.success(`Pesanan berhasil dibuat! #${data.data?.orderNumber ?? ""}`)
      router.push("/admin/orders")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="p-6">Loading...</div>

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold">Manual Order</h1>
          <p className="text-sm text-muted-foreground">Buat pesanan manual untuk pelanggan</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Data Pelanggan</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nama Pelanggan</Label>
              <Input
                value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                placeholder="Nama lengkap"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email Pelanggan</Label>
              <Input
                type="email"
                value={form.customerEmail}
                onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                placeholder="email@contoh.com"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Catatan (opsional)</Label>
              <Input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Catatan internal..."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Item Pesanan</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Tambah Item
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-[1fr_80px_36px] gap-3 p-3 border rounded-lg relative">
                <div className="space-y-1.5">
                  <Label className="text-xs">Produk & Varian</Label>
                  <select
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                    value={item.variantId}
                    onChange={(e) => updateItem(i, "variantId", e.target.value)}
                  >
                    <option value="">Pilih varian...</option>
                    {products.flatMap((p) =>
                      (p.variants ?? []).map((v) => (
                        <option key={v.id} value={v.id}>
                          {p.name} — {v.name} (Rp {v.price.toLocaleString("id-ID")})
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Qty</Label>
                  <Input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateItem(i, "quantity", parseInt(e.target.value) || 1)}
                  />
                </div>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    className="mt-6 w-8 h-8 rounded-full bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/20 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={submitting} className="gap-2">
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? "Membuat Pesanan..." : "Buat Pesanan"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/admin/orders")}>
            Batal
          </Button>
        </div>
      </form>
    </div>
  )
}