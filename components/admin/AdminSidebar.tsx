"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Package, Archive, ShoppingBag, LogOut, Menu, X, Store, Tags, ShieldCheck, Star, Bot } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"

const links = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Produk", icon: Package },
  { href: "/admin/stock", label: "Stok", icon: Archive },
  { href: "/admin/orders", label: "Pesanan", icon: ShoppingBag, badgeKey: "pending" },
  { href: "/admin/vouchers", label: "Voucher", icon: Tags },
  { href: "/admin/warranty", label: "Klaim", icon: ShieldCheck },
  { href: "/admin/reviews", label: "Ulasan", icon: Star },
  { href: "/admin/suppliers", label: "Supplier", icon: Bot },
]

function SidebarContent({
  pathname,
  onLogout,
  pendingCount,
}: {
  pathname: string
  onLogout: () => void
  pendingCount: number
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b flex items-center gap-2.5">
        <Image src="/logo.png" alt="Bubblepi" width={32} height={32} className="rounded-lg" />
        <div>
          <p className="font-bold text-sm">Bubblepi</p>
          <p className="text-xs text-muted-foreground">Admin Panel</p>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {links.map(({ href, label, icon: Icon, badgeKey }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              pathname.startsWith(href)
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="flex-1">{label}</span>
            {badgeKey === "pending" && pendingCount > 0 && (
              <span className="ml-auto text-xs font-bold bg-destructive text-destructive-foreground rounded-full min-w-5 h-5 flex items-center justify-center px-1">
                {pendingCount > 99 ? "99+" : pendingCount}
              </span>
            )}
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t space-y-1">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Store className="h-4 w-4" />
          Lihat Toko
        </Link>
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  )
}

export default function AdminSidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d) => setPendingCount(d.pending ?? 0))
      .catch(() => {})
    // Refresh every 60s
    const interval = setInterval(() => {
      fetch("/api/admin/stats")
        .then((r) => r.json())
        .then((d) => setPendingCount(d.pending ?? 0))
        .catch(() => {})
    }, 60_000)
    return () => clearInterval(interval)
  }, [])

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" })
    window.location.href = "/login"
  }

  return (
    <>
      <aside className="hidden md:flex w-56 min-h-screen bg-card border-r flex-col shrink-0">
        <SidebarContent pathname={pathname} onLogout={handleLogout} pendingCount={pendingCount} />
      </aside>

      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b h-14 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="Bubblepi" width={28} height={28} className="rounded-lg" />
          <span className="font-bold text-sm">Bubblepi Admin</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 relative">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          {!mobileOpen && pendingCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
          )}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="w-64 bg-card border-r h-full pt-14">
            <SidebarContent pathname={pathname} onLogout={handleLogout} pendingCount={pendingCount} />
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setMobileOpen(false)} />
        </div>
      )}
    </>
  )
}
