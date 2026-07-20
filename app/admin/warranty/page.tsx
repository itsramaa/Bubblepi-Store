import { db } from "@/lib/db"
import WarrantyList from "./WarrantyList"

export const dynamic = "force-dynamic"

export default async function WarrantyPage() {
  const claims = await db.warrantyClaim.findMany({
    include: { order: { select: { orderNumber: true, guestEmail: true, guestName: true } }, orderItem: { include: { variant: { include: { product: { select: { name: true } } } } } } },
    orderBy: { submittedAt: "desc" },
  })
  return <WarrantyList claims={JSON.parse(JSON.stringify(claims))} />
}
