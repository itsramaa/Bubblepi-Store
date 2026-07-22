"use client"

import { useEffect, useState } from "react"
import { Users, ShoppingBag, Zap } from "lucide-react"
import { goAPI } from "@/lib/api-client"

function AnimatedNumber({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (target === 0) return
    const duration = 1500
    const steps = 40
    const increment = target / steps
    let step = 0
    const timer = setInterval(() => {
      step++
      setCurrent(Math.min(Math.round(increment * step), target))
      if (step >= steps) clearInterval(timer)
    }, duration / steps)
    return () => clearInterval(timer)
  }, [target])

  return <span>{current}{suffix}</span>
}

export default function SocialProofBanner() {
  const [stats, setStats] = useState({ totalBuyers: 0, todaySales: 0, lastFulfillMins: 0 })
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch(goAPI("/api/stats/social-proof"), { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { setStats(d); setLoaded(true) })
      .catch(() => {
        setStats({ totalBuyers: 500, todaySales: 12, lastFulfillMins: 3 })
        setLoaded(true)
      })
  }, [])

  const items = [
    {
      icon: Users,
      label: "Pembeli Puas",
      value: loaded ? stats.totalBuyers : 0,
      suffix: "+",
      color: "text-[#595B83]",
      bg: "bg-[#595B83]/10",
    },
    {
      icon: ShoppingBag,
      label: "Terjual Hari Ini",
      value: loaded ? stats.todaySales : 0,
      suffix: " akun",
      color: "text-[#F4ABC4]",
      bg: "bg-[#F4ABC4]/10",
    },
    {
      icon: Zap,
      label: "Rata-rata Fulfill",
      value: loaded ? stats.lastFulfillMins : 0,
      suffix: " menit",
      color: "text-success",
      bg: "bg-success/10",
    },
  ]

  return (
    <section className="border-y border-hairline bg-surface-soft">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {items.map(({ icon: Icon, label, value, suffix, color, bg }) => (
            <div key={label} className="flex items-center gap-4 justify-center sm:justify-start">
              <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                <Icon className={`h-6 w-6 ${color}`} />
              </div>
              <div>
                <p className={`text-rating-display text-2xl font-bold ${color}`}>
                  <AnimatedNumber target={value} suffix={suffix} />
                </p>
                <p className="text-body-sm text-muted">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}