import { fetchFromGo, parseJson } from "@/lib/api-client"

const EVENTS = ["VIEW_PRODUCT", "ADD_TO_CART", "CHECKOUT_START", "PAYMENT_INITIATED", "PAYMENT_SUCCESS"] as const
const LABELS: Record<string, string> = {
  VIEW_PRODUCT: "Lihat Produk",
  ADD_TO_CART: "Tambah ke Keranjang",
  CHECKOUT_START: "Mulai Checkout",
  PAYMENT_INITIATED: "Inisiasi Pembayaran",
  PAYMENT_SUCCESS: "Pembayaran Sukses",
}

interface FunnelData {
  counts: number[]
}

export async function AnalyticsFunnel() {
  let counts: number[] = []
  try {
    const res = await fetchFromGo("/admin/stats")
    const stats = await parseJson<FunnelData>(res)
    counts = stats.counts ?? EVENTS.map(() => 0)
  } catch {
    counts = EVENTS.map(() => 0)
  }

  const top = counts[0] || 1
  return (
    <div className="space-y-2">
      <p className="text-body-sm font-semibold text-muted">Funnel Konversi (30 hari)</p>
      {EVENTS.map((event, i) => (
        <div key={event} className="flex items-center gap-3 text-body-sm">
          <span className="w-44 text-muted">{LABELS[event]}</span>
          <div className="flex-1 bg-surface-strong rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full"
              style={{ width: `${(counts[i] / top) * 100}%` }}
            />
          </div>
          <span className="w-16 text-right font-medium tabular-nums">{counts[i].toLocaleString("id-ID")}</span>
        </div>
      ))}
    </div>
  )
}