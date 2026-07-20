/**
 * User Dashboard Layout
 */

import { redirect } from "next/navigation"
import { getUserFromSession } from "@/lib/auth"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUserFromSession()
  if (!user || !user.userId) {
    redirect("/login")
  }

  return (
    <div className="container mx-auto py-8">
      {children}
    </div>
  )
}