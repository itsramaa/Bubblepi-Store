"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  type: string // product type: "streaming" | "ai" | etc
}

const PREVIEWS: Record<string, { label: string; value: string }[]> = {
  streaming: [
    { label: "Email", value: "user****@gmail.com" },
    { label: "Password", value: "••••••••••" },
    { label: "Profil", value: "Slot 1 (Private)" },
  ],
  ai: [
    { label: "Email", value: "user****@gmail.com" },
    { label: "Password", value: "••••••••••" },
    { label: "Plan", value: "Pro / Plus" },
  ],
  design: [
    { label: "Email", value: "user****@gmail.com" },
    { label: "Password", value: "••••••••••" },
    { label: "Lisensi", value: "Team / Pro" },
  ],
  default: [
    { label: "Email", value: "user****@gmail.com" },
    { label: "Password", value: "••••••••••" },
  ],
}

export default function CredentialPreview({ type }: Props) {
  const [revealed, setRevealed] = useState(false)
  const fields = PREVIEWS[type] ?? PREVIEWS.default

  return (
    <div className="rounded-2xl border bg-muted/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Contoh Isi Akun</p>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 gap-1.5 text-xs"
          onClick={() => setRevealed((v) => !v)}
        >
          {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {revealed ? "Sembunyikan" : "Lihat Contoh"}
        </Button>
      </div>

      {revealed && (
        <div className="space-y-2">
          {fields.map((f) => (
            <div key={f.label} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{f.label}</span>
              <span className="font-mono text-xs bg-background border rounded px-2 py-0.5">
                {f.value}
              </span>
            </div>
          ))}
          <p className="text-[11px] text-muted-foreground pt-1">
            * Ini contoh format. Akun asli dikirim ke email setelah pembayaran berhasil.
          </p>
        </div>
      )}
    </div>
  )
}
