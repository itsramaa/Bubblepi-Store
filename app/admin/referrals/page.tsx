import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

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

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Referral</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Top Referrer</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(summary).length === 0 && <p className="text-muted-foreground text-sm">Belum ada referral.</p>}
            {Object.entries(summary)
              .sort((a, b) => b[1].count - a[1].count)
              .slice(0, 10)
              .map(([email, data]) => (
                <div key={email} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground truncate max-w-[200px]">{email}</span>
                  <div className="flex gap-2">
                    <Badge variant="secondary">{data.count}x</Badge>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Semua Referral</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {referrals.slice(0, 20).map((r) => (
              <div key={r.id} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{r.referrerEmail}</span>
                <Badge variant={r.status === "CONFIRMED" ? "default" : "secondary"}>{r.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
