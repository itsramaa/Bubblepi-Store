import { Suspense } from "react"
import Navbar from "@/components/store/Navbar"
import Footer from "@/components/store/Footer"

function FloatingWhatsAppLoader() {
  const FloatingWhatsApp = require("@/components/store/FloatingWhatsApp").default
  return <FloatingWhatsApp />
}

function LiveActivityToastLoader() {
  const LiveActivityToast = require("@/components/store/LiveActivityToast").default
  return <LiveActivityToast />
}

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">{children}</main>
      <Footer />
      <Suspense fallback={null}>
        <FloatingWhatsAppLoader />
      </Suspense>
      <Suspense fallback={null}>
        <LiveActivityToastLoader />
      </Suspense>
    </div>
  )
}
