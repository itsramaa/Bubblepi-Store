"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import OrderTimeline from "@/components/store/OrderTimeline"
import CredentialsCard from "@/components/store/CredentialsCard"
import { WarrantyTimer } from "@/components/store/WarrantyTimer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { formatPrice } from "@/lib/utils"
import type { OrderWithItems } from "@/types"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { ArrowLeft, RefreshCw, Copy, Check, Share2, Mail, ShoppingCart, Lock, Share } from "lucide-react"
import { toast } from "sonner"
import { useCart } from "@/context/CartContext"

const TERMINAL_STATUSES = ["FULFILLED", "FAILED"]
const EMAIL_VERIFIED_KEY = (id: string) => `order_verified_${id}`

export default function OrderStatusPage() {
  const { id } = useParams<{ id: string }>()
  const { addItem } = useCart()
  const router = useRouter()
  const [order, setOrder] = useState<OrderWithItems | null>(null)
  const [loading, setLoading] = useState(true)
  const [polling, setPolling] = useState(true)
  const [resending, setResending] = useState(false)
  const [claimForm, setClaimForm] = useState({ orderItemId: "", description: "" })
  const [claims, setClaims] = useState<any[]>([])
  const [submittingClaim, setSubmittingClaim] = useState(false)
  const [copiedOrderNum, setCopiedOrderNum] = useState(false)

  // Email verification gate
  const [emailVerified, setEmailVerified] = useState(false)
  const [emailInput, setEmailInput] = useState("")
  const [emailError, setEmailError] = useState("")
  const [verifying, setVerifying] = useState(false)

  // Check sessionStorage for already-verified orders
  useEffect(() => {
    try {
      const verified = sessionStorage.getItem(EMAIL_VERIFIED_KEY(id))
      if (verified === "1") setEmailVerified(true)
    } catch {}
  }, [id])

  async function fetchOrder() {
    try {
      const res = await fetch(`/api/orders/${id}`)
      const data = await res.json()
      if (data.success) {
        setOrder(data.data)
        if (TERMINAL_STATUSES.includes(data.data.status)) setPolling(false)
      }
    } finally {
      setLoading(false)
    }
  }

  async function fetchClaims() {
    try {
      const res = await fetch(`/api/warranty?orderId=${id}`)
      const data = await res.json()
      if (data.claims) setClaims(data.claims)
    } catch {}
  }

  useEffect(() => {
    fetchOrder()
    if (!polling) return
    const interval = setInterval(fetchOrder, 8000)
    return () => clearInterval(interval)
  }, [id, polling])

  useEffect(() => { fetchClaims() }, [id])

  function handleVerifyEmail(e: React.FormEvent) {
    e.preventDefault()
    if (!order) return
    setVerifying(true)
    setEmailError("")

    if (emailInput.trim().toLowerCase() === order.customerEmail.toLowerCase()) {
      setEmailVerified(true)
      try { sessionStorage.setItem(EMAIL_VERIFIED_KEY(id), "1") } catch {}
    } else {
      setEmailError("Email tidak sesuai dengan pesanan ini.")
    }
    setVerifying(false)
  }

  async function handleResend() {
    setResending(true)
    try {
      const res = await fetch(`/api/orders/${id}/resend-email`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success("Email berhasil dikirim ulang!")
      fetchOrder()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setResending(false)
    }
  }

  async function handleClaimSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmittingClaim(true)
    try {
      const res = await fetch("/api/warranty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: id, ...claimForm }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success("Klaim garansi berhasil diajukan!")
      setClaimForm({ orderItemId: "", description: "" })
      fetchClaims()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSubmittingClaim(false)
    }
  }

  function handleReorder() {
    if (!order) return
    let added = 0
    order.items.forEach((item) => {
      addItem({
        variantId: item.variantId,
        productId: item.variant.productId,
        productName: item.variant.product.name,
        variantName: item.variant.name,
        price: item.price,
        duration: item.variant.duration,
      })
      added++
    })
    toast.success(`${added} item ditambahkan ke keranjang!`)
    router.push("/cart")
  }

  function handleShareWA() {
    if (!order) return
    const text = `Saya baru beli ${order.items.map(i => i.variant.product.name).join(", ")} di Bubblepi Store! Cek pesananku: ${window.location.href}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank")
  }

  function handleShareLink() {
    if (!order) return
    const link = `${window.location.origin}/?ref=${btoa(order.customerEmail)}`
    navigator.clipboard.writeText(link).then(() => {
      toast.success("Link referral disalin!")
    })
  }

  function copyOrderNumber() {
    if (!order) return
    navigator.clipboard.writeText(order.orderNumber)
    setCopiedOrderNum(true)
    setTimeout(() => setCopiedOrderNum(false), 2000)
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card><CardContent className="p-6 space-y-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </CardContent></Card>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center space-y-4">
        <p className="text-4xl">🔍</p>
        <p className="text-lg font-semibold">Pesanan tidak ditemukan</p>
        <Link href="/"><Button variant="outline">Kembali ke Beranda</Button></Link>
      </div>
    )
  }

  // Email verification gate — hanya muncul untuk FULFILLED orders yang belum verified
  if (order.status === "FULFILLED" && !emailVerified) {
    return (
      <div className="max-w-md mx-auto px-4 py-24">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#595B83]/10 mb-4">
            <Lock className="h-8 w-8 text-[#595B83]" />
          </div>
          <h1 className="text-xl font-bold text-[#333456]">Verifikasi Email</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Masukkan email yang kamu gunakan saat checkout untuk melihat akun.
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleVerifyEmail} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Email Pesanan</label>
                <Input
                  type="email"
                  placeholder="nama@email.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  required
                  autoFocus
                />
                {emailError && <p className="text-xs text-destructive">{emailError}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={verifying}>
                {verifying ? "Memverifikasi..." : "Verifikasi & Lihat Pesanan"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Lupa email? <Link href="/cek-pesanan" className="underline">Cek pesanan lewat email</Link>
        </p>
      </div>
    )
  }

  const warrantyItems = order.items.filter((i: any) => i.variant?.hasWarranty)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Kembali
      </Link>

      <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">Status Pesanan</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-muted-foreground text-sm">Order #{order.orderNumber}</p>
            <button onClick={copyOrderNumber} className="text-muted-foreground hover:text-foreground" title="Salin nomor order">
              {copiedOrderNum ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {polling && <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />}
        </div>
      </div>

      {/* Timeline */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <OrderTimeline status={order.status} />
        </CardContent>
      </Card>

      {/* Actions */}
      {order.status === "FULFILLED" && (
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 mb-6">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleReorder}>
            <ShoppingCart className="h-4 w-4" /> Beli Lagi
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleResend} disabled={resending}>
            <Mail className="h-4 w-4" /> {resending ? "Mengirim..." : "Kirim Ulang Email"}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleShareWA}>
            <Share2 className="h-4 w-4" /> Bagikan ke WA
          </Button>
        </div>
      )}

      {/* Order detail */}
      <Card className="mb-6">
        <CardHeader className="pb-3"><CardTitle className="text-base">Detail Pesanan</CardTitle></CardHeader>
        <CardContent className="space-y-3 p-4 md:p-6">
          <div className="space-y-1 text-sm text-muted-foreground">
            <div className="flex justify-between gap-2"><span>Nama</span><span className="text-foreground font-medium text-right">{order.customerName}</span></div>
            <div className="flex justify-between gap-2"><span className="shrink-0">Email</span><span className="text-foreground font-medium break-all text-right">{order.customerEmail}</span></div>
            {order.status === "FAILED" && order.cancelReason && (
              <div className="flex justify-between"><span>Alasan</span><span className="text-destructive font-medium">{order.cancelReason}</span></div>
            )}
          </div>
          <div className="border-t pt-3 space-y-1.5">
            {order.items.map((item: any) => (
              <div key={item.id} className="flex justify-between gap-2 text-sm">
                <span className="text-muted-foreground min-w-0 break-words">{item.variant.product.name} ({item.variant.name}) ×{item.quantity}</span>
                <span className="font-medium shrink-0">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm font-bold pt-1 border-t">
              <span>Total</span>
              <span className="text-primary">{formatPrice(order.total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Credentials — hanya tampil setelah email verified */}
      {order.status === "FULFILLED" && emailVerified && order.stocks?.length > 0 && (
        <CredentialsCard stocks={order.stocks} />
      )}

      {/* Garansi Timer */}
      {order.status === "FULFILLED" && warrantyItems.length > 0 && order.paidAt && (
        <WarrantyTimer paidAt={order.paidAt} items={warrantyItems} />
      )}

      {/* Warranty Claims */}
      {order.status === "FULFILLED" && emailVerified && warrantyItems.length > 0 && (
        <Card className="mt-6 border-amber-200 dark:border-amber-800">
          <CardContent className="p-6">
            <h3 className="font-semibold flex items-center gap-2 mb-3">🛡️ Klaim Garansi</h3>
            {claims.length > 0 && (
              <div className="mb-4 space-y-2">
                <p className="text-sm font-medium">Riwayat Klaim:</p>
                {claims.map((c: any) => (
                  <div key={c.id} className="text-sm p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={c.status === "APPROVED" ? "default" : c.status === "REJECTED" ? "destructive" : "secondary"} className="text-xs">
                        {c.status === "PENDING" ? "Diproses" : c.status === "APPROVED" ? "Disetujui" : "Ditolak"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString("id-ID")}</span>
                    </div>
                    <p className="text-muted-foreground">{c.description}</p>
                    {c.resolveNote && <p className="text-xs text-muted-foreground mt-1">Catatan: {c.resolveNote}</p>}
                  </div>
                ))}
              </div>
            )}
            {claims.some((c: any) => c.status === "PENDING") ? (
              <p className="text-sm text-muted-foreground">Klaimmu sedang diproses.</p>
            ) : (
              <form onSubmit={handleClaimSubmit} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Pilih Item</label>
                  <select
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                    value={claimForm.orderItemId}
                    onChange={(e) => setClaimForm({ ...claimForm, orderItemId: e.target.value })}
                    required
                  >
                    <option value="">Pilih item bermasalah</option>
                    {warrantyItems.map((i: any) => (
                      <option key={i.id} value={i.id}>
                        {i.variant.product.name} ({i.variant.name})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Deskripsi Masalah</label>
                  <Textarea
                    value={claimForm.description}
                    onChange={(e) => setClaimForm({ ...claimForm, description: e.target.value })}
                    placeholder="Jelaskan masalah yang kamu alami..."
                    required
                    rows={3}
                  />
                </div>
                <Button type="submit" disabled={submittingClaim}>
                  {submittingClaim ? "Mengirim..." : "Ajukan Klaim"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {/* Bagikan ke teman / Referral */}
      {order.status === "FULFILLED" && emailVerified && (
        <Card className="mt-6 border-[#F4ABC4]">
          <CardHeader>
            <CardTitle className="text-base text-[#333456] flex items-center gap-2">
              <Share className="h-4 w-4" /> Bagikan ke Teman
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-500">
              Bagikan link referral kamu. Setiap teman yang beli, kamu dapat komisi Rp 5.000.
            </p>
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <code className="flex-1 min-w-0 rounded-md bg-gray-100 px-3 py-2 text-xs break-all text-[#333456]">
                {typeof window !== "undefined" ? `${window.location.origin}/?ref=${btoa(order.customerEmail)}` : ""}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={handleShareLink}
              >
                <Copy className="h-3.5 w-3.5 mr-1" />
                Salin
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
