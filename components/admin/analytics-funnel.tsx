import { db } from "@/lib/db"

const EVENTS = ["VIEW_PRODUCT", "ADD_TO_CART", "CHECKOUT_START", "PAYMENT_INITIATED", "PAYMENT_SUCCESS"] as const
const LABELS: Record<string, string> = {
  VIEW_PRODUCT: "Lihat Produk",
  ADD_TO_CART: "Tambah ke Keranjang",
  CHECKOUT_START: "Mulai Checkout",
  PAYMENT_INITIATED: "Inisiasi Pembayaran",
  PAYMENT_SUCCESS: "Pembayaran Sukses",
}

export async function AnalyticsFunnel() {
  // eslint-disable-next-line react-hooks/purity
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const counts = await Promise.all(
    EVENTS.map((event) =>
      db.funnelEvent.count({ where: { event, createdAt: { gte: since } } })
    )
  )
  const top = counts[0] || 1
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground">Funnel Konversi (30 hari)</h3>
      {EVENTS.map((event, i) => (
        <div key={event} className="flex items-center gap-3 text-sm">
          <span className="w-44 text-muted-foreground">{LABELS[event]}</span>
          <div className="flex-1 bg-muted rounded-full h-2">
            <div
              className="bg-pink-400 h-2 rounded-full"
              style={{ width: `${(counts[i] / top) * 100}%` }}
            />
          </div>
          <span className="w-16 text-right font-medium tabular-nums">{counts[i].toLocaleString("id-ID")}</span>
        </div>
      ))}
    </div>
  )
}
