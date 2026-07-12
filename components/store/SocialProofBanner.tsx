"use client"

import { useEffect, useState } from "react"
import { Users, ShoppingBag, TrendingUp } from "lucide-react"

export default function SocialProofBanner() {
  const [stats, setStats] = useState({ totalBuyers: 0, todaySales: 0, lastFulfillMins: 0 })

  useEffect(() => {
    fetch("/api/stats/social-proof")
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => {})
    const interval = setInterval(() => {
      fetch("/api/stats/social-proof")
        .then((r) => r.json())
        .then((d) => setStats(d))
        .catch(() => {})
    }, 30_000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="bg-gradient-to-r from-[#F4ABC4]/10 to-[#595B83]/10 py-6">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-2xl font-bold">{stats.totalBuyers > 0 ? `${stats.totalBuyers}+` : "..."}</p>
              <p className="text-sm text-muted-foreground">Pembeli Percaya</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <ShoppingBag className="h-5 w-5 text-green-600" />
            </div>
            <div className="text-left">
              <p className="text-2xl font-bold">{stats.todaySales > 0 ? stats.todaySales : "..."}</p>
              <p className="text-sm text-muted-foreground">Terjual Hari Ini</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-amber-600" />
            </div>
            <div className="text-left">
              <p className="text-2xl font-bold">
                {stats.lastFulfillMins > 0 ? `${stats.lastFulfillMins}m` : "..."}
              </p>
              <p className="text-sm text-muted-foreground">Fulfill Terakhir</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
