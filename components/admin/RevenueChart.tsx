"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatPrice } from "@/lib/utils"
import { TrendingUp } from "lucide-react"

interface DataPoint { date: string; revenue: number }

export default function RevenueChart() {
  const [data, setData] = useState<DataPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/revenue/chart")
      .then((r) => r.json())
      .then((d) => setData(d.data ?? []))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <Card>
      <CardHeader><CardTitle>Revenue 30 Hari</CardTitle></CardHeader>
      <CardContent className="h-48 flex items-center justify-center text-muted-foreground text-sm">
        Memuat data...
      </CardContent>
    </Card>
  )

  const max = Math.max(...data.map((d) => d.revenue), 1)
  const totalRevenue = data.reduce((a, d) => a + d.revenue, 0)
  const nonZeroDays = data.filter((d) => d.revenue > 0).length

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Revenue 30 Hari
        </CardTitle>
        <div className="text-right">
          <p className="text-sm font-bold">{formatPrice(totalRevenue)}</p>
          <p className="text-xs text-muted-foreground">{nonZeroDays} hari aktif</p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-0.5 h-32">
          {data.map((d) => {
            const pct = max > 0 ? (d.revenue / max) * 100 : 0
            const date = new Date(d.date)
            const isToday = d.date === new Date().toISOString().slice(0, 10)
            return (
              <div
                key={d.date}
                className="flex-1 flex flex-col items-center gap-1 group relative"
                title={`${date.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}: ${formatPrice(d.revenue)}`}
              >
                <div
                  className={`w-full rounded-t transition-all ${
                    d.revenue > 0
                      ? isToday
                        ? "bg-primary"
                        : "bg-primary/50 group-hover:bg-primary"
                      : "bg-muted"
                  }`}
                  style={{ height: `${Math.max(pct, d.revenue > 0 ? 4 : 2)}%` }}
                />
                {/* Tooltip on hover — CSS only */}
                {d.revenue > 0 && (
                  <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-popover border text-xs px-2 py-1 rounded shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                    {date.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}<br />
                    {formatPrice(d.revenue)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>{new Date(data[0]?.date ?? "").toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</span>
          <span>Hari ini</span>
        </div>
      </CardContent>
    </Card>
  )
}
