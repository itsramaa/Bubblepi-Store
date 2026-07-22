"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"

import { ArrowLeft, Loader2, Plus, Trash2, Save } from "lucide-react"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { goAPI } from "@/lib/api-client"
import { toast } from "sonner"

interface Variant { id: string; name: string; duration: string; price: number; hasWarranty: boolean; warrantyDays: number | null }
interface Product { id: string; name: string; slug: string; description: string; image: string; category: string; type: string; isActive: boolean; variants: Variant[] }

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [newVariant, setNewVariant] = useState({ name: "", duration: "", price: "" })
  const [addingVariant, setAddingVariant] = useState(false)

  useEffect(() => {
    fetch(goAPI(`/api/admin/products/${id}`), { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (d.success) setProduct(d.data) })
      .finally(() => setLoading(false))
  }, [id])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!product) return
    setSaving(true)
    setError("")
    try {
      const res = await fetch(goAPI(`/api/admin/products/${id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: product.name,
          slug: product.slug,
          description: product.description,
          image: product.image,
          category: product.category,
          type: product.type,
          isActive: product.isActive,
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error ?? "Gagal menyimpan")
      router.push("/admin/products")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan")
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteVariant(variantId: string) {
    if (!confirm("Hapus varian ini?")) return
    await fetch(goAPI(`/api/admin/variants/${variantId}`), { method: "DELETE", credentials: "include" })
    setProduct((p) => p ? { ...p, variants: p.variants.filter((v) => v.id !== variantId) } : p)
    toast.success("Varian berhasil dihapus")
  }

  async function handleAddVariant() {
    if (!newVariant.name.trim()) return
    setAddingVariant(true)
    const res = await fetch(goAPI(`/api/admin/products/${id}/variants`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ productId: id, name: newVariant.name, price: parseInt(newVariant.price) }),
    })
    const data = await res.json()
    if (data.success) {
      setProduct((p) => p ? { ...p, variants: [...p.variants, data.data] } : p)
      setNewVariant({ name: "", duration: "", price: "" })
    }
    setAddingVariant(false)
  }

  async function handleDeleteProduct() {
    if (!confirm("Hapus produk ini beserta semua variannya? Tindakan ini tidak bisa dibatalkan.")) return
    await fetch(goAPI(`/api/admin/products/${id}`), { method: "DELETE", credentials: "include" })
    toast.success("Produk berhasil dihapus")
    router.push("/admin/products")
  }

  if (loading) return (
    <div className="max-w-2xl space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full" />
    </div>
  )

  if (!product) return (
    <div className="text-center py-16">
      <p className="text-muted-foreground">Produk tidak ditemukan</p>
      <Link href="/admin/products"><Button variant="outline" className="mt-4">Kembali</Button></Link>
    </div>
  )

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/products">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Produk</h1>
          <p className="text-sm text-muted-foreground">{product.name}</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Info Produk</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nama Produk</Label>
              <Input required value={product.name} onChange={(e) => setProduct({ ...product, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Slug</Label>
              <Input required value={product.slug} onChange={(e) => setProduct({ ...product, slug: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Deskripsi</Label>
              <Textarea required rows={3} value={product.description} onChange={(e) => setProduct({ ...product, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Kategori</Label>
                <Input required value={product.category} onChange={(e) => setProduct({ ...product, category: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>URL Gambar</Label>
                <Input value={product.image} onChange={(e) => setProduct({ ...product, image: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Tipe Akun</Label>
              <select
                className="border rounded-md px-3 py-2 text-sm bg-background"
                value={product.type}
                onChange={(e) => setProduct({ ...product, type: e.target.value })}
              >
                <option value="sharing">🔗 Sharing</option>
                <option value="private">🔑 Private</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <Label>Produk Aktif</Label>
              <Switch checked={product.isActive} onCheckedChange={(v) => setProduct({ ...product, isActive: v })} />
            </div>
          </CardContent>
        </Card>

        {/* Variants */}
        <Card>
          <CardHeader><CardTitle className="text-base">Varian Harga</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {product.variants.map((v) => (
              <div key={v.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="flex-1 grid grid-cols-3 gap-2 text-sm">
                  <span className="font-medium">{v.name}</span>
                  <span className="text-muted-foreground">{v.duration}</span>
                  <span className="font-medium">Rp {v.price.toLocaleString("id-ID")}</span>
                </div>
                <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={() => handleDeleteVariant(v.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}

            {/* Add variant */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t">
              <Input value={newVariant.name} onChange={(e) => setNewVariant({ ...newVariant, name: e.target.value })} placeholder="3 Bulan" />
              <Input value={newVariant.duration} onChange={(e) => setNewVariant({ ...newVariant, duration: e.target.value })} placeholder="90 hari" />
              <Input type="number" value={newVariant.price} onChange={(e) => setNewVariant({ ...newVariant, price: e.target.value })} placeholder="150000" />
            </div>
            <Button type="button" variant="outline" size="sm" className="gap-1.5 w-full" onClick={handleAddVariant} disabled={addingVariant || !newVariant.name.trim()}>
              {addingVariant ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Tambah Varian
            </Button>
          </CardContent>
        </Card>

        {error && <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">{error}</p>}

        <div className="flex items-center justify-between">
          <div className="flex gap-3">
            <Button type="submit" disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
            <Link href="/admin/products"><Button type="button" variant="outline">Batal</Button></Link>
          </div>
          <Button type="button" variant="destructive" onClick={handleDeleteProduct}>Hapus Produk</Button>
        </div>
      </form>
    </div>
  )
}
