"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Bell, Check } from "lucide-react"

interface PriceDropNotifyProps {
  variantId: string
  currentPrice: number
}

const STORAGE_KEY = "priceDropNotified"

function getNotifiedSet(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

function markNotified(variantId: string) {
  const set = getNotifiedSet()
  set.add(variantId)
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]))
}

export default function PriceDropNotify({ variantId, currentPrice }: PriceDropNotifyProps) {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (getNotifiedSet().has(variantId)) {
      setSubmitted(true)
    }
  }, [variantId])

  if (submitted) {
    return (
      <div className="flex items-center gap-2 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-sm">
        <Check className="h-4 w-4 shrink-0" />
        Kami akan memberitahu kamu saat harga turun!
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    try {
      const res = await fetch("/api/notify-me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), variantId, targetPrice: currentPrice }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Gagal mendaftar notifikasi")
        return
      }
      markNotified(variantId)
      setSubmitted(true)
    } catch {
      toast.error("Terjadi kesalahan. Coba lagi.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 rounded-xl border bg-muted/30 space-y-3">
      <p className="text-sm font-medium flex items-center gap-1.5">
        <Bell className="h-4 w-4 text-primary" />
        Ingin tahu kalau harga turun?
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="email"
          placeholder="Masukkan email kamu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="flex-1 text-sm"
        />
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? "..." : "Ingatkan"}
        </Button>
      </form>
    </div>
  )
}
