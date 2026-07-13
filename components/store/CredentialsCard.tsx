"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, EyeOff, Copy, Check, ShieldAlert, CheckCircle2 } from "lucide-react"

interface Props {
  stocks: Array<{ id: string; credentials: string; variantId: string }>
}

export default function CredentialsCard({ stocks }: Props) {
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})
  const [copied, setCopied] = useState<string | null>(null)
  const [allCopied, setAllCopied] = useState(false)

  function toggleReveal(id: string) {
    setRevealed((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  function toggleRevealAll() {
    const allRevealed = stocks.every((s) => revealed[s.id])
    const next: Record<string, boolean> = {}
    stocks.forEach((s) => { next[s.id] = !allRevealed })
    setRevealed(next)
  }

  async function copyToClipboard(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement("textarea")
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand("copy")
      document.body.removeChild(ta)
    }
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  async function copyAll() {
    const allCreds = stocks.map((s) => s.credentials).join("\n\n")
    try {
      await navigator.clipboard.writeText(allCreds)
    } catch {
      const ta = document.createElement("textarea")
      ta.value = allCreds
      document.body.appendChild(ta)
      ta.select()
      document.execCommand("copy")
      document.body.removeChild(ta)
    }
    setAllCopied(true)
    setTimeout(() => setAllCopied(false), 2000)
  }

  const allRevealed = stocks.every((s) => revealed[s.id])

  return (
    <Card className="mt-8 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span>📦</span> Akun Kamu
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Warning */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
          <p>Jangan bagikan credentials ini ke siapapun. Simpan di tempat aman.</p>
        </div>

        {/* Bulk actions */}
        {stocks.length > 1 && (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="text-xs gap-1.5" onClick={toggleRevealAll}>
              {allRevealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {allRevealed ? "Sembunyikan Semua" : "Tampilkan Semua"}
            </Button>
            <Button variant="ghost" size="sm" className="text-xs gap-1.5" onClick={copyAll}>
              {allCopied ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
              {allCopied ? "Semua Disalin ✓" : "Salin Semua"}
            </Button>
          </div>
        )}

        {stocks.map((stock, i) => (
          <div key={stock.id} className="rounded-xl border bg-muted/30 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/50">
              <Badge variant="outline" className="text-xs">Akun #{i + 1}</Badge>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => toggleReveal(stock.id)}
                  title={revealed[stock.id] ? "Sembunyikan" : "Tampilkan"}
                >
                  {revealed[stock.id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => copyToClipboard(stock.credentials, stock.id)}
                  title="Salin"
                >
                  {copied === stock.id
                    ? <Check className="h-3.5 w-3.5 text-green-500" />
                    : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
            {/* Blur → clear transition on reveal */}
            <div
              className={`font-mono text-sm p-4 transition-all duration-300 select-all ${
                revealed[stock.id]
                  ? "blur-none"
                  : "blur-sm select-none cursor-pointer"
              }`}
              onClick={() => !revealed[stock.id] && toggleReveal(stock.id)}
              title={revealed[stock.id] ? undefined : "Klik untuk menampilkan"}
            >
              {stock.credentials}
            </div>
          </div>
        ))}

        {/* Per-item copy feedback is handled inline via copied state */}
      </CardContent>
    </Card>
  )
}
