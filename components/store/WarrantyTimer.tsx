"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"

interface Props {
  paidAt: string | Date
  items: Array<{ variant: { warrantyDays?: number | null } }>
}

export default function WarrantyTimer({ paidAt, items }: Props) {
  const maxDays = Math.max(...items.map((i) => i.variant.warrantyDays ?? 0))
  const endDate = new Date(new Date(paidAt).getTime() + maxDays * 86400_000)

  const [remaining, setRemaining] = useState<{ days: number; hours: number; totalDays: number }>({ days: 0, hours: 0, totalDays: maxDays })

  useEffect(() => {
    function calc() {
      const diff = endDate.getTime() - Date.now()
      if (diff <= 0) return setRemaining({ days: 0, hours: 0, totalDays: maxDays })
      setRemaining({
        days: Math.floor(diff / 86400_000),
        hours: Math.floor((diff % 86400_000) / 3600_000),
        totalDays: maxDays,
      })
    }
    calc()
    const interval = setInterval(calc, 60000)
    return () => clearInterval(interval)
  }, [endDate, maxDays])

  const pct = remaining.totalDays > 0 ? (remaining.days / remaining.totalDays) * 100 : 0
  const barColor = pct > 50 ? "bg-green-500" : pct > 20 ? "bg-amber-500" : "bg-red-500"

  return (
    <Card className="mt-6 border-green-200 dark:border-green-800">
      <CardContent className="p-6">
        <h3 className="font-semibold flex items-center gap-2 mb-3">🛡️ Garansi Aktif</h3>
        {remaining.days > 0 ? (
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Garansi berlaku selama <strong>{remaining.days} hari {remaining.hours} jam</strong> lagi.
            </p>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div className={`h-full ${barColor} transition-all duration-500 rounded-full`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Garansi sudah berakhir.</p>
        )}
      </CardContent>
    </Card>
  )
}
