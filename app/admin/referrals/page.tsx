import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, TrendingUp } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function ReferralsPage() {
  const referrals = await db.referral.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  const summary = referrals.reduce((acc, r) => {
    if (!acc[r.referrerEmail]) acc[r.referrerEmail] = { count: 0, total: 0 }
    acc[r.referrerEmail].count++
    acc[r.referrerEmail].total += r.commissionValue
    return acc
  }, {} as Record<string, { count: number; total: number }>)

  const totalReferrals = referrals.length
  const totalCommission = referrals.reduce((sum, r) => sum + r.commissionValue, 0)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Referral</h1>

      {/* Top stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalReferrals}</p>
              <p className="text-xs text-muted-foreground">Total Referral</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">Rp {totalCommission.toLocaleString("id-ID")}</p>
              <p className="text-xs text-muted-foreground">Total Komisi Dibayar</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Top Referrer</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(summary).length === 0 && (
              <p className="text-muted-foreground text-sm">Belum ada referral.</p>
            )}
            {Object.entries(summary)
              .sort((a, b) => b[1].count - a[1].count)
              .slice(0, 10)
              .map(([email, data]) => (
                <div key={email} className="flex items-center justify-between text-sm py-1">
                  <span className="text-muted-foreground truncate max-w-[180px]">{email}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">Rp {data.total.toLocaleString("id-ID")}</span>
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary">
                      {data.count}x
                    </span>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Semua Referral</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {referrals.length === 0 && (
              <p className="text-muted-foreground text-sm">Belum ada referral.</p>
            )}
            {referrals.slice(0, 20).map((r) => (
              <div key={r.id} className="flex items-center justify-between text-sm py-1">
                <div className="min-w-0">
                  <p className="text-muted-foreground truncate">{r.referrerEmail}</p>
                  <p className="text-xs text-muted-foreground/60">
                    {new Date(r.createdAt).toLocaleDateString("id-ID")}
                  </p>
                </div>
                {r.status === "CONFIRMED" ? (
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 shrink-0">
                    CONFIRMED
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 shrink-0">
                    PENDING
                  </span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
