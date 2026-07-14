import { db } from "@/lib/db"
import SupplierList from "./SupplierList"

export const dynamic = "force-dynamic"

export default async function SuppliersPage() {
  const suppliers = await db.supplierBot.findMany({
    include: { products: true },
    orderBy: { createdAt: "desc" },
  })
  const variants = await db.variant.findMany({
    include: { product: true },
    orderBy: { product: { name: "asc" } },
  })
  return (
    <SupplierList
      suppliers={JSON.parse(JSON.stringify(suppliers))}
      variants={JSON.parse(JSON.stringify(variants))}
    />
  )
}
