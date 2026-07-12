import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { ThemeProvider } from "@/context/ThemeContext"
import { CartProvider } from "@/context/CartContext"
import LenisProvider from "@/components/LenisProvider"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" })
// ponytail: CalSans not on Google Fonts — add local font file to public/fonts/ post-MVP

export const metadata: Metadata = {
  title: "Bubblepi Store — Digital Account Shop",
  description: "Toko akun digital sharing: Netflix, Spotify, Canva, ChatGPT, dan lainnya.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrains.variable} font-sans antialiased min-h-screen`}>
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
