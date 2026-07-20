/**
 * Admin Dashboard
 */

"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Stats {
  totalOrders: number
  pendingOrders: number
  revenue: number
  warrantyClaims: number
  lowStockCount: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    pendingOrders: 0,
    revenue: 0,
    warrantyClaims: 0,
    lowStockCount: 0,
  })

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then(setStats)
      .catch(console.error)
  }, [])

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Total Orders</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalOrders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Pending</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.pendingOrders}</p>
            <Badge variant="outline" className="mt-1">Needs attention</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Revenue</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">Rp {stats.revenue.toLocaleString("id-ID")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Warranty Claims</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.warrantyClaims}</p>
            {stats.warrantyClaims > 0 && <Badge className="mt-1 bg-yellow-500">Pending</Badge>}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <a href="/admin/orders" className="block p-2 hover:bg-muted rounded">📋 Manage Orders</a>
            <a href="/admin/products" className="block p-2 hover:bg-muted rounded">📦 Manage Products</a>
            <a href="/admin/warranty" className="block p-2 hover:bg-muted rounded">🛡️ Warranty Claims ({stats.warrantyClaims})</a>
            <a href="/admin/manual-order" className="block p-2 hover:bg-muted rounded">➕ Manual Order</a>
            <a href="/admin/pricelist" className="block p-2 hover:bg-muted rounded">💰 Price List</a>
            <a href="/admin/suppliers" className="block p-2 hover:bg-muted rounded">🔗 Suppliers</a>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Stock Status</CardTitle></CardHeader>
          <CardContent>
            <p>Available Stock: <strong>{stats.lowStockCount}</strong></p>
            {stats.lowStockCount <= 5 && (
              <Badge variant="destructive" className="mt-2">Low Stock Alert!</Badge>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}