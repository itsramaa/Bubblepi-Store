import type { Metadata } from "next"
import { Poppins } from "next/font/google"
import { ThemeProvider } from "@/context/ThemeContext"
import { CartProvider } from "@/context/CartContext"
import LenisProvider from "@/components/LenisProvider"
import "./globals.css"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
})
export const metadata: Metadata = {
  title: "Bubblepi Store — Digital Account Shop",
  description: "Toko akun digital sharing: Netflix, Spotify, Canva, ChatGPT, dan lainnya.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${poppins.variable} font-sans antialiased min-h-screen`}>
        <ThemeProvider>
          <CartProvider>
            <LenisProvider />
            {children}
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
