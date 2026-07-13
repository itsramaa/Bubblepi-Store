interface StockBadgeProps {
  availableStock: number
}

export function StockBadge({ availableStock }: StockBadgeProps) {
  if (availableStock <= 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
        Stok habis
      </span>
    )
  }

  if (availableStock <= 5) {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-200">
        Tersisa {availableStock}
      </span>
    )
  }

  return null
}
