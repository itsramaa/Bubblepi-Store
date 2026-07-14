import dynamic from "next/dynamic"
import Navbar from "@/components/store/Navbar"
import Footer from "@/components/store/Footer"

const FloatingWhatsApp = dynamic(() => import("@/components/store/FloatingWhatsApp"), { ssr: false })
const LiveActivityToast = dynamic(() => import("@/components/store/LiveActivityToast"), { ssr: false })

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">{children}</main>
      <Footer />
      <FloatingWhatsApp />
      <LiveActivityToast />
    </div>
  )
}
