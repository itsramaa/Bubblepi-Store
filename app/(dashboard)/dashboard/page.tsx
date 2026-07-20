/**
 * User Dashboard Home
 */

import { redirect } from "next/navigation"
import Link from "next/link"
import { getUserFromSession } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function DashboardPage() {
  const user = await getUserFromSession()
  if (!user || !user.userId) {
    redirect("/login")
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Dashboard</h1>
      <p className="text-muted-foreground">Welcome back, {user.email || "User"}!</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/dashboard/orders">
          <Card className="hover:bg-muted/50 cursor-pointer transition-colors">
            <CardHeader><CardTitle>📦 My Orders</CardTitle></CardHeader>
            <CardContent>View your order history and status</CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/warranty">
          <Card className="hover:bg-muted/50 cursor-pointer transition-colors">
            <CardHeader><CardTitle>🛡️ My Warranties</CardTitle></CardHeader>
            <CardContent>Manage warranty claims</CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}