"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Lock, Mail, Loader2, User } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { toast } from "sonner"
import { goAPI } from "@/lib/api-client"

type LoginMode = "user" | "admin"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<LoginMode>(() => {
    const next = searchParams.get("next")
    return next?.startsWith("/admin") ? "admin" : "user"
  })
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const endpoint = mode === "admin" ? "/api/admin/auth" : "/api/auth/login"
      const body = mode === "admin" ? JSON.stringify({ password }) : JSON.stringify({ email, password })

      const res = await fetch(goAPI(endpoint), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        credentials: "include",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Login gagal")

      const next = searchParams.get("next") || (mode === "admin" ? "/admin/dashboard" : "/dashboard")
      router.push(next)
      toast.success("Login berhasil!")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#060930] via-[#333456] to-[#595B83]">
      <div className="flex flex-col items-center gap-3 mb-8">
        <Image src="/logo.png" alt="Bubblepi" width={56} height={56} className="rounded-2xl shadow-lg" />
        <div className="text-center">
          <p className="text-white font-bold text-xl tracking-tight">Bubblepi</p>
          <p className="text-white/60 text-sm">{mode === "admin" ? "Admin Panel" : "Masuk Akun"}</p>
        </div>
      </div>

      <div className="flex bg-white/10 rounded-lg p-1 mb-6">
        <button
          onClick={() => setMode("user")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            mode === "user" ? "bg-white text-gray-900 shadow-sm" : "text-white/70 hover:text-white"
          }`}
        >
          <User className="h-4 w-4" />
          Pembeli
        </button>
        <button
          onClick={() => setMode("admin")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            mode === "admin" ? "bg-white text-gray-900 shadow-sm" : "text-white/70 hover:text-white"
          }`}
        >
          <Lock className="h-4 w-4" />
          Admin
        </button>
      </div>

      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {mode === "admin" ? <Lock className="h-5 w-5" /> : <Mail className="h-5 w-5" />}
            {mode === "admin" ? "Admin Login" : "Masuk"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "user" && (
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@contoh.com" autoComplete="email" required />
              </div>
            )}
            <div>
              <Label htmlFor="password">{mode === "admin" ? "Password Admin" : "Password"}</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={mode === "admin" ? "Masukkan password admin" : "Masukkan password"} autoComplete="current-password" required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Login"}
            </Button>
          </form>

          {mode === "user" && (
            <p className="text-sm text-center text-muted-foreground mt-4">
              Belum punya akun?{" "}
              <Link href="/register" className="text-primary hover:underline">
                Daftar sekarang
              </Link>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#060930] via-[#333456] to-[#595B83]">
        <div className="text-white text-lg">Memuat...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}