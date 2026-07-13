import { db } from "@/lib/db"

export async function LiveFulfillmentBadge() {
  const lastOrder = await db.order.findFirst({
    where: { status: "FULFILLED" },
    orderBy: { paidAt: "desc" },
    include: { items: { include: { variant: { include: { product: { select: { name: true } } } } } } },
  }).catch(() => null)

  if (!lastOrder?.paidAt) return null

  const minutesAgo = Math.floor((Date.now() - lastOrder.paidAt.getTime()) / 60000)
  const timeText = minutesAgo < 60 ? `${minutesAgo} menit lalu` : `${Math.floor(minutesAgo / 60)} jam lalu`
  const names = [...new Set(lastOrder.items.map((i) => i.variant.product.name))].join(", ")

  return (
    <div className="flex items-center justify-center gap-2 rounded-full bg-[#F4ABC4]/20 px-4 py-2 text-sm text-[#333456]">
      <span className="animate-pulse">⚡</span>
      <span>Terakhir fulfill: <strong>{names}</strong> — {timeText}</span>
    </div>
  )
}
