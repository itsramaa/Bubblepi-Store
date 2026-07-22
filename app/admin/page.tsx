import { redirect } from "next/navigation"

// Richer dashboard lives at /admin/dashboard
// This page re-routes to avoid duplicate entry points
export default function AdminPage() {
  redirect("/admin/dashboard")
}