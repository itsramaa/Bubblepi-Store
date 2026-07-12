const steps = [
  { status: "PENDING", label: "Pesanan Dibuat" },
  { status: "AWAITING_PAYMENT", label: "Menunggu Pembayaran" },
  { status: "PAID", label: "Pembayaran Diterima" },
  { status: "FULFILLED", label: "Akun Dikirim" },
]

const ORDER = ["PENDING", "AWAITING_PAYMENT", "PAID", "FULFILLED"]

export default function OrderTimeline({ status }: { status: string }) {
  const currentIndex = ORDER.indexOf(status)
  const isFailed = status === "FAILED" || status === "PENDING_STOCK"

  return (
    <div className="space-y-3">
      {steps.map((step, i) => {
        const done = i <= currentIndex && !isFailed
        const active = i === currentIndex && !isFailed
        return (
          <div key={step.status} className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full shrink-0 ${done ? "bg-primary" : active ? "bg-primary/60 animate-pulse" : "bg-muted"}`} />
            <span className={`text-sm ${done ? "font-medium" : "text-muted-foreground"}`}>{step.label}</span>
          </div>
        )
      })}
      {isFailed && (
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full shrink-0 bg-destructive" />
          <span className="text-sm font-medium text-destructive">{status === "PENDING_STOCK" ? "Menunggu Stok" : "Gagal"}</span>
        </div>
      )}
    </div>
  )
}
