"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react"
import Link from "next/link"

interface VariantForm {
  name: string
  duration: string
  price: string
}

export default function NewProductPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    image: "",
    category: "",
    type: "sharing",
    isActive: true,
  })
  const [variants, setVariants] = useState<VariantForm[]>([
    { name: "", duration: "", price: "" },
  ])

  function autoSlug(name: string) {
    return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
  }

  function addVariant() {
    setVariants((v) => [...v, { name: "", duration: "", price: "" }])
  }

  function removeVariant(i: number) {
    setVariants((v) => v.filter((_, idx) => idx !== i))
  }

  function updateVariant(i: number, field: keyof VariantForm, value: string) {
    setVariants((v) => v.map((item, idx) => idx === i ? { ...item, [field]: value } : item))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSaving(true)

    try {
      // Create product
      const productRes = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form }),
      })
      const productData = await productRes.json()
      if (!productData.success) throw new Error(productData.error ?? "Gagal membuat produk")

      const productId = productData.data.id

      // Create variants
      for (const v of variants) {
        if (!v.name.trim()) continue
        const vRes = await fetch("/api/admin/variants", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId,
            name: v.name,
            duration: v.duration,
            price: parseInt(v.price),
          }),
        })
        const vData = await vRes.json()
        if (!vData.success) throw new Error(vData.error ?? "Gagal membuat varian")
      }

      router.push("/admin/products")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/products">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Tambah Produk</h1>
          <p className="text-sm text-muted-foreground">Isi detail produk dan varian harga</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Info Produk</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nama Produk</Label>
              <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: autoSlug(e.target.value) })} placeholder="Netflix Premium" />
            </div>
            <div className="space-y-1.5">
              <Label>Slug</Label>
              <Input required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="netflix-premium" />
              <p className="text-xs text-muted-foreground">URL: /products/{form.slug || "..."}</p>
            </div>
            <div className="space-y-1.5">
              <Label>Deskripsi</Label>
              <Textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Deskripsi produk..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Tipe Akun</Label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="sharing">🔗 Sharing</option>
                  <option value="private">🔑 Private</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Kategori</Label>
                <Input required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="streaming" />
              </div>
              <div className="space-y-1.5">
                <Label>URL Gambar</Label>
                <Input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="/products/netflix.svg" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Produk Aktif</Label>
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Varian Harga</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addVariant} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Tambah Varian
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {variants.map((v, i) => (
              <div key={i} className="grid grid-cols-3 gap-3 p-3 border rounded-lg relative">
                <div className="space-y-1.5">
                  <Label className="text-xs">Nama Varian</Label>
                  <Input value={v.name} onChange={(e) => updateVariant(i, "name", e.target.value)} placeholder="1 Bulan" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Durasi</Label>
                  <Input value={v.duration} onChange={(e) => updateVariant(i, "duration", e.target.value)} placeholder="30 hari" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Harga (IDR)</Label>
                  <Input type="number" value={v.price} onChange={(e) => updateVariant(i, "price", e.target.value)} placeholder="50000" />
                </div>
                {variants.length > 1 && (
                  <button type="button" onClick={() => removeVariant(i)} className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center">
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {error && <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" disabled={saving} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Menyimpan..." : "Simpan Produk"}
          </Button>
          <Link href="/admin/products"><Button type="button" variant="outline">Batal</Button></Link>
        </div>
      </form>
    </div>
  )
}
