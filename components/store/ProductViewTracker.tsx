"use client"

import { useEffect } from "react"
import { trackEvent } from "@/lib/analytics"

interface Props {
  productId: string
}

export function ProductViewTracker({ productId }: Props) {
  useEffect(() => {
    trackEvent("VIEW_PRODUCT", { productId })
  }, [productId])
  return null
}
