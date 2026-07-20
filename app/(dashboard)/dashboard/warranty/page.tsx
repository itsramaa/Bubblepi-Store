/**
 * User Dashboard - Warranty Status
 */

import { db } from "@/lib/db"
import { getUserFromSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { format, differenceInDays } from "date-fns"
import { id } from "date-fns/locale"

async function getUserWarranties(userId: string | undefined) {
  if (!userId) return []
  return db.warranty.findMany({
    where: { userId },
    include: {
      order: {
        include: { items: { include: { variant: { include: { product: true } } } } },
      },
      claims: { orderBy: { submittedAt: "desc" } },
    },
    orderBy: { startDate: "desc" },
  })
}

function getStatusBadge(status: string) {
  const styles: Record<string, string> = { ACTIVE: "bg-green-500", EXPIRED: "bg-gray-500" }
  return <Badge className={styles[status] || "bg-gray-500"}>{status}</Badge>
}

export default async function UserWarrantyPage() {
  const user = await getUserFromSession()
  if (!user || !user.userId) redirect("/login")

  const warranties = await getUserWarranties(user.userId)

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Garansi Saya</h1>
        <Link href="/dashboard">
          <Button variant="outline">← Kembali</Button>
        </Link>
      </div>

      {warranties.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <p>Belum ada garansi aktif</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {warranties.map((warranty) => {
            const daysLeft = warranty.expiryDate ? differenceInDays(new Date(warranty.expiryDate), new Date()) : 0
            const isExpired = daysLeft < 0
            const hasPendingClaim = warranty.claims.some((c: any) => c.status === "PENDING_REVIEW")

            return (
              <Card key={warranty.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{warranty.order.items[0]?.variant.product.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{warranty.order.items[0]?.variant.name} • {warranty.duration} hari</p>
                    </div>
                    {getStatusBadge(warranty.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Mulai</p>
                      <p className="font-medium">{warranty.startDate ? format(new Date(warranty.startDate), "dd MMM yyyy", { locale: id }) : "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Berakhir</p>
                      <p className="font-medium">{warranty.expiryDate ? format(new Date(warranty.expiryDate), "dd MMM yyyy", { locale: id }) : "-"}</p>
                    </div>
                  </div>
                  {isExpired && <p className="text-red-500 text-sm mb-4">Garansi telah berakhir</p>}
                  {!isExpired && daysLeft <= 7 && <p className="text-orange-500 text-sm mb-4">Berakhir dalam {daysLeft} hari</p>}
                  {hasPendingClaim && <p className="text-blue-500 text-sm mb-4">Klaim garansi sedang diproses</p>}
                  {!isExpired && !hasPendingClaim && warranty.status === "ACTIVE" && (
                    <Link href={`/dashboard/warranty/${warranty.id}/claim`}>
                      <Button>Klaim Garansi</Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}