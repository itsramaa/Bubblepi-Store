"use client"

import dynamic from "next/dynamic"
import { Suspense } from "react"

const FloatingWhatsApp = dynamic(
  () => import("@/components/store/FloatingWhatsApp").then((mod) => mod.default),
  { ssr: false }
)

const LiveActivityToast = dynamic(
  () => import("@/components/store/LiveActivityToast").then((mod) => mod.default),
  { ssr: false }
)

export function ClientSideComponents() {
  return (
    <>
      <Suspense fallback={null}>
        <FloatingWhatsApp />
      </Suspense>
      <Suspense fallback={null}>
        <LiveActivityToast />
      </Suspense>
    </>
  )
}