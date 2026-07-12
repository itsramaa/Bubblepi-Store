import { db } from "@/lib/db"
import VoucherList from "./VoucherList"

export const dynamic = "force-dynamic"

export default async function VouchersPage() {
  const vouchers = await db.voucher.findMany({ orderBy: { createdAt: "desc" } })
  return <VoucherList vouchers={JSON.parse(JSON.stringify(vouchers))} />
}
