import { fetchFromGo, parseJson } from "@/lib/api-client"
import WarrantyList from "./WarrantyList"
import type { WarrantyClaim } from "@/types"

export const dynamic = "force-dynamic"

export default async function WarrantyPage() {
  const res = await fetchFromGo("/admin/warranty")
  const claims = await parseJson<WarrantyClaim[]>(res)
  return <WarrantyList claims={claims} />
}