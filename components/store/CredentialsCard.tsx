"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff, Copy, Check } from "lucide-react"

interface Props {
  stocks: Array<{ id: string; credentials: string; variantId: string }>
}

export default function CredentialsCard({ stocks }: Props) {
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})
  const [copied, setCopied] = useState<string | null>(null)

  function toggleReveal(id: string) {
    setRevealed((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  async function copyToClipboard(text: string, id: string) {
    await navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <Card className="mt-8">
      <CardHeader><CardTitle>📦 Akun Anda</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-destructive font-medium">⚠️ Jangan bagikan credentials ini! Simpan di tempat aman.</p>
        {stocks.map((stock) => (
          <div key={stock.id} className="flex items-center gap-2">
            <div className={`flex-1 font-mono text-sm bg-muted p-3 rounded transition-all ${revealed[stock.id] ? "" : "blur-sm select-none"}`}>
              {stock.credentials}
            </div>
            <Button variant="ghost" size="icon" onClick={() => toggleReveal(stock.id)}>
              {revealed[stock.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => copyToClipboard(stock.credentials, stock.id)}>
              {copied === stock.id ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
