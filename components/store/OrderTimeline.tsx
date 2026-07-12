import { CheckCircle2, Clock, Package, AlertCircle, Loader2 } from "lucide-react"

const steps = [
  { status: "PENDING", label: "Pesanan Dibuat", icon: Package },
  { status: "AWAITING_PAYMENT", label: "Menunggu Pembayaran", icon: Clock },
  { status: "PAID", label: "Pembayaran Diterima", icon: CheckCircle2 },
  { status: "FULFILLED", label: "Akun Dikirim", icon: CheckCircle2 },
]

const ORDER = ["PENDING", "AWAITING_PAYMENT", "PAID", "FULFILLED"]

export default function OrderTimeline({ status }: { status: string }) {
  const currentIndex = ORDER.indexOf(status)
  const isFailed = status === "FAILED" || status === "PENDING_STOCK"

  return (
    <div className="relative">
      {/* vertical line */}
      <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-border" />

      <div className="space-y-6">
        {steps.map((step, i) => {
          const done = i < currentIndex && !isFailed
          const active = i === currentIndex && !isFailed
          const Icon = step.icon

          return (
            <div key={step.status} className="flex items-center gap-4 relative">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 shrink-0 transition-colors ${
                done
                  ? "bg-primary text-primary-foreground"
                  : active
                  ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                  : "bg-background border-2 border-border text-muted-foreground"
              }`}>
                {active && !done ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>
              <div>
                <p className={`text-sm font-medium ${done || active ? "text-foreground" : "text-muted-foreground"}`}>
                  {step.label}
                </p>
                {active && (
                  <p className="text-xs text-muted-foreground mt-0.5">Sedang diproses...</p>
                )}
              </div>
            </div>
          )
        })}

        {isFailed && (
          <div className="flex items-center gap-4 relative">
            <div className="w-8 h-8 rounded-full flex items-center justify-center z-10 bg-destructive text-destructive-foreground shrink-0">
              <AlertCircle className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-destructive">
                {status === "PENDING_STOCK" ? "Menunggu Stok" : "Pesanan Gagal"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {status === "PENDING_STOCK" ? "Admin akan segera memproses pesanan kamu." : "Hubungi admin untuk bantuan."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
