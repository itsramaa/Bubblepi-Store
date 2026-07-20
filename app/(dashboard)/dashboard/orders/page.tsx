/**
 * User Dashboard - Order History
 */

import { db } from "@/lib/db"
import { getUserFromSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { format } from "date-fns"
import { id } from "date-fns/locale"

async function getUserOrders(userId: string | undefined) {
  if (!userId) return []
  return db.order.findMany({
    where: { userId },
    include: {
      items: {
        include: {
          variant: { include: { product: true } },
        },
      },
      warranty: true,
    },
    orderBy: { createdAt: "desc" },
  })
}

function getStatusBadge(status: string) {
  const styles: Record<string, string> = {
    PENDING: "bg-yellow-500",
    AWAITING_PAYMENT: "bg-orange-500",
    PROCESSING: "bg-blue-500",
    DELIVERED: "bg-green-500",
    CANCELLED: "bg-red-500",
  }
  const labels: Record<string, string> = {
    PENDING: "Menunggu",
    AWAITING_PAYMENT: "Menunggu Pembayaran",
    PROCESSING: "Diproses",
    DELIVERED: "Terkirim",
    CANCELLED: "Dibatalkan",
  }
  return <Badge className={styles[status] || "bg-gray-500"}>{labels[status] || status}</Badge>
}

export default async function UserOrdersPage() {
  const user = await getUserFromSession()
  if (!user || !user.userId) redirect("/login")

  const orders = await getUserOrders(user.userId)

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Pesanan Saya</h1>
        <Link href="/dashboard">
          <Button variant="outline">← Kembali</Button>
        </Link>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <p>Belum ada pesanan</p>
            <Link href="/products">
              <Button className="mt-4">Belanja Sekarang</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-lg">{order.orderNumber}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(order.createdAt), "dd MMMM yyyy, HH:mm", { locale: id })}
                  </p>
                </div>
                {getStatusBadge(order.status)}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{item.variant.product.name}</p>
                        <p className="text-sm text-muted-foreground">{item.variant.name}</p>
                      </div>
                      <p className="font-medium">Rp {item.price.toLocaleString("id-ID")}</p>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-xl font-bold">Rp {order.total.toLocaleString("id-ID")}</p>
                  </div>
                  <div className="flex gap-2">
                    {order.warranty && (
                      <Link href={`/dashboard/orders/${order.id}/warranty`}>
                        <Button variant="outline" size="sm">Garansi {order.warranty.status}</Button>
                      </Link>
                    )}
                    <Link href={`/orders/${order.id}`}>
                      <Button size="sm">Detail</Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}