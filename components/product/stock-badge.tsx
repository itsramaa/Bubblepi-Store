export function StockBadge({ availableStock }: { availableStock: number }) {
  if (availableStock <= 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-destructive/10 text-destructive text-badge font-semibold px-2.5 py-0.5 border border-destructive/20">
        Stok habis
      </span>
    )
  }
  if (availableStock <= 5) {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 text-badge font-semibold px-2.5 py-0.5 border border-amber-200">
        Tersisa {availableStock}
      </span>
    )
  }
  return null
}