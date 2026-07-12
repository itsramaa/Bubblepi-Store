import { db } from "@/lib/db"
import WarrantyList from "./WarrantyList"

export const dynamic = "force-dynamic"

export default async function WarrantyPage() {
  const claims = await db.warrantyClaim.findMany({
    include: { order: { select: { orderNumber: true, customerEmail: true, customerName: true } }, orderItem: { include: { variant: { include: { product: { select: { name: true } } } } } } },
    orderBy: { createdAt: "desc" },
  })
  return <WarrantyList claims={JSON.parse(JSON.stringify(claims))} />
}
