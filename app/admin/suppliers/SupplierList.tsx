"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Plus, RefreshCw, Wallet, Trash2, Link2, Link2Off } from "lucide-react"

type Variant = {
  id: string
  name: string
  duration: string
  price: number
  product: { name: string }
}

type SupplierProduct = {
  id: string
  variantId: string
  productNo: number
  productBotId: string
  variantBotId: string
  label: string
  isActive: boolean
}

type Supplier = {
  id: string
  label: string
  botUsername: string
  serviceUrl: string
  isActive: boolean
  products: SupplierProduct[]
}

type Props = {
  suppliers: Supplier[]
  variants: Variant[]
}

const emptyMapForm = { variantId: "", productNo: "", productBotId: "", variantBotId: "", label: "" }

export default function SupplierList({ suppliers: initial, variants }: Props) {
  const [suppliers, setSuppliers] = useState(initial)
  const [balances, setBalances] = useState<Record<string, number | null>>({})
  const [loadingBalance, setLoadingBalance] = useState<Record<string, boolean>>({})
  const [addOpen, setAddOpen] = useState(false)
  const [mapOpen, setMapOpen] = useState<string | null>(null)
  const [topupOpen, setTopupOpen] = useState<string | null>(null)
  const [topupAmount, setTopupAmount] = useState("10000")
  const [topupLoading, setTopupLoading] = useState(false)
  const [form, setForm] = useState({ label: "", botUsername: "", serviceUrl: "http://127.0.0.1:8081" })
  const [mapForm, setMapForm] = useState(emptyMapForm)

  async function fetchBalance(id: string) {
    setLoadingBalance((p) => ({ ...p, [id]: true }))
    try {
      const res = await fetch(`/api/admin/suppliers/${id}/balance`)
      const data = await res.json()
      setBalances((p) => ({ ...p, [id]: typeof data.saldo === "number" ? data.saldo : null }))
    } catch {
      toast.error("Gagal ambil saldo")
    } finally {
      setLoadingBalance((p) => ({ ...p, [id]: false }))
    }
  }

  async function handleAdd() {
    if (!form.label || !form.botUsername || !form.serviceUrl) {
      toast.error("Semua field wajib diisi")
      return
    }
    const res = await fetch("/api/admin/suppliers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    if (!res.ok) { toast.error((await res.json()).error); return }
    const created = await res.json()
    setSuppliers((p) => [{ ...created, products: [] }, ...p])
    setForm({ label: "", botUsername: "", serviceUrl: "http://127.0.0.1:8081" })
    setAddOpen(false)
    toast.success("Bot supplier ditambahkan")
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus supplier bot ini?")) return
    await fetch(`/api/admin/suppliers/${id}`, { method: "DELETE" })
    setSuppliers((p) => p.filter((s) => s.id !== id))
    toast.success("Dihapus")
  }

  async function handleToggle(id: string, isActive: boolean) {
    const res = await fetch(`/api/admin/suppliers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    })
    const updated = await res.json()
    setSuppliers((p) => p.map((s) => (s.id === id ? { ...s, isActive: updated.isActive } : s)))
  }

  async function handleTopup(id: string) {
    setTopupLoading(true)
    try {
      const res = await fetch(`/api/admin/suppliers/${id}/topup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseInt(topupAmount) }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success(
        <div>
          <p className="font-semibold">Link Pembayaran QRIS</p>
          <a href={data.payment_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline text-xs break-all">
            {data.payment_url}
          </a>
          <p className="text-xs mt-1">Total: Rp {data.total?.toLocaleString("id-ID")} (fee: Rp {data.fee?.toLocaleString("id-ID")})</p>
        </div>,
        { duration: 30000 }
      )
      setTopupOpen(null)
    } catch {
      toast.error("Gagal topup")
    } finally {
      setTopupLoading(false)
    }
  }

  async function handleAddMapping(supplierId: string) {
    const { variantId, productNo, productBotId, variantBotId, label } = mapForm
    if (!variantId || !productNo || !productBotId || !variantBotId || !label) {
      toast.error("Semua field mapping wajib diisi")
      return
    }
    const res = await fetch(`/api/admin/suppliers/${supplierId}/mappings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variantId, productNo: parseInt(productNo), productBotId, variantBotId, label }),
    })
    if (!res.ok) { toast.error((await res.json()).error); return }
    const mapping = await res.json()
    setSuppliers((p) => p.map((s) => s.id === supplierId ? { ...s, products: [...s.products, mapping] } : s))
    setMapForm(emptyMapForm)
    toast.success("Mapping ditambahkan")
  }

  async function handleDeleteMapping(supplierId: string, mappingId: string) {
    await fetch(`/api/admin/suppliers/${supplierId}/mappings?mappingId=${mappingId}`, { method: "DELETE" })
    setSuppliers((p) => p.map((s) => s.id === supplierId ? { ...s, products: s.products.filter((m) => m.id !== mappingId) } : s))
    toast.success("Mapping dihapus")
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Supplier Bots</h1>
          <p className="text-muted-foreground text-sm">Kelola bot supplier Telegram dan mapping produk</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Tambah Bot
        </Button>
      </div>

      {/* Add Bot Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tambah Bot Supplier</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Label (e.g. Barbar Store)" value={form.label} onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))} />
            <Input placeholder="Username bot (tanpa @)" value={form.botUsername} onChange={(e) => setForm((p) => ({ ...p, botUsername: e.target.value }))} />
            <Input placeholder="Service URL (e.g. http://127.0.0.1:8081)" value={form.serviceUrl} onChange={(e) => setForm((p) => ({ ...p, serviceUrl: e.target.value }))} />
            <Button className="w-full" onClick={handleAdd}>Simpan</Button>
          </div>
        </DialogContent>
      </Dialog>

      {suppliers.length === 0 && (
        <div className="text-center text-muted-foreground py-12">
          Belum ada bot supplier. Klik &quot;Tambah Bot&quot; untuk mulai.
        </div>
      )}

      <div className="grid gap-4">
        {suppliers.map((s) => (
          <Card key={s.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {s.label}
                    <Badge variant={s.isActive ? "default" : "secondary"}>
                      {s.isActive ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">@{s.botUsername} · {s.serviceUrl}</p>
                  <p className="text-sm text-muted-foreground">{s.products.length} mapping produk</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => fetchBalance(s.id)} disabled={!!loadingBalance[s.id]}>
                    <RefreshCw className={`w-3 h-3 mr-1 ${loadingBalance[s.id] ? "animate-spin" : ""}`} />
                    Saldo: {balances[s.id] != null ? `Rp ${(balances[s.id] as number).toLocaleString("id-ID")}` : "—"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setTopupOpen(s.id)}>
                    <Wallet className="w-3 h-3 mr-1" /> Topup
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleToggle(s.id, s.isActive)}>
                    {s.isActive ? <Link2Off className="w-3 h-3 mr-1" /> : <Link2 className="w-3 h-3 mr-1" />}
                    {s.isActive ? "Nonaktifkan" : "Aktifkan"}
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(s.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {s.products.length > 0 && (
                <div className="border rounded-md divide-y">
                  {s.products.map((m) => {
                    const variant = variants.find((v) => v.id === m.variantId)
                    return (
                      <div key={m.id} className="flex items-center justify-between px-3 py-2 text-sm">
                        <div>
                          <span className="font-medium">{variant?.product.name} — {variant?.name}</span>
                          <span className="text-muted-foreground ml-2">→ {m.label}</span>
                          <span className="text-xs text-muted-foreground ml-2">(no.{m.productNo}, pid:{m.productBotId}, vid:{m.variantBotId})</span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteMapping(s.id, m.id)}>
                          <Trash2 className="w-3 h-3 text-red-500" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
              <Button variant="outline" size="sm" onClick={() => setMapOpen(s.id)}>
                <Plus className="w-3 h-3 mr-1" /> Tambah Mapping
              </Button>
            </CardContent>

            {/* Topup Dialog */}
            <Dialog open={topupOpen === s.id} onOpenChange={(o) => setTopupOpen(o ? s.id : null)}>
              <DialogContent>
                <DialogHeader><DialogTitle>Topup Saldo — {s.label}</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Pembayaran via QRIS. Ada fee dari payment gateway.</p>
                  <Input type="number" placeholder="Jumlah (IDR)" value={topupAmount} onChange={(e) => setTopupAmount(e.target.value)} min={1000} />
                  <Button className="w-full" onClick={() => handleTopup(s.id)} disabled={topupLoading}>
                    {topupLoading ? "Memproses..." : "Generate Link QRIS"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Add Mapping Dialog */}
            <Dialog open={mapOpen === s.id} onOpenChange={(o) => setMapOpen(o ? s.id : null)}>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>Mapping Produk — {s.label}</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Variant Bubblepi</label>
                    <Select value={mapForm.variantId} onValueChange={(v: string | null) => setMapForm((p) => ({ ...p, variantId: v ?? "" }))}>
                      <SelectTrigger><SelectValue placeholder="Pilih variant..." /></SelectTrigger>
                      <SelectContent>
                        {variants.map((v) => (
                          <SelectItem key={v.id} value={v.id}>{v.product.name} — {v.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground">No. Produk di Bot</label>
                      <Input placeholder="e.g. 9" value={mapForm.productNo} onChange={(e) => setMapForm((p) => ({ ...p, productNo: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Product Bot ID</label>
                      <Input placeholder="e.g. 7791" value={mapForm.productBotId} onChange={(e) => setMapForm((p) => ({ ...p, productBotId: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Variant Bot ID</label>
                      <Input placeholder="e.g. 29397" value={mapForm.variantBotId} onChange={(e) => setMapForm((p) => ({ ...p, variantBotId: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Label</label>
                      <Input placeholder="e.g. CAPCUT PRO - 7 DAY" value={mapForm.label} onChange={(e) => setMapForm((p) => ({ ...p, label: e.target.value }))} />
                    </div>
                  </div>
                  <Button className="w-full" onClick={() => handleAddMapping(s.id)}>Simpan Mapping</Button>
                </div>
              </DialogContent>
            </Dialog>
          </Card>
        ))}
      </div>
    </div>
  )
}
