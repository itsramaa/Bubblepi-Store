import { fetchFromGo, parseJson } from "@/lib/api-client"
import VoucherList from "./VoucherList"
import type { Voucher } from "@/types"

export const dynamic = "force-dynamic"

export default async function VouchersPage() {
  const res = await fetchFromGo("/admin/vouchers")
  const vouchers = await parseJson<Voucher[]>(res)
  return <VoucherList vouchers={vouchers} />
}