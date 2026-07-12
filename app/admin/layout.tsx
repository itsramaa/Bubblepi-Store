import AdminSidebar from "@/components/admin/AdminSidebar"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/30 flex">
      <AdminSidebar />
      <main className="flex-1 p-6 md:p-8 pt-20 md:pt-8 max-w-screen-xl">{children}</main>
    </div>
  )
}
