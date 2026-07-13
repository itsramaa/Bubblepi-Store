import { redirect } from "next/navigation"

// Legacy page — duplikat dari /cek-pesanan. Redirect supaya tidak orphan.
export default function OrdersPage() {
  redirect("/cek-pesanan")
}
