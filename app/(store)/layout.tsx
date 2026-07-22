import Navbar from "@/components/store/Navbar"
import Footer from "@/components/store/Footer"
import { ClientSideComponents } from "@/components/store/ClientSideComponents"

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20">{children}</main>
      <Footer />
      <ClientSideComponents />
    </div>
  )
}