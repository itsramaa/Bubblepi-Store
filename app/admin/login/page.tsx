"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Lock, Loader2 } from "lucide-react"
import Image from "next/image"
import { goAPI } from "@/lib/api-client"

export default function LoginPage() {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const res = await fetch(goAPI("/api/admin/auth"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
      credentials: "include",
    })

    if (res.ok) {
      router.push("/admin/dashboard")
    } else {
      setError("Password salah")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#060930] via-[#333456] to-[#595B83]">
      {/* Brand */}
      <div className="flex flex-col items-center gap-3 mb-8">
        <Image
          src="/logo.png"
          alt="Bubblepi"
          width={56}
          height={56}
          className="rounded-2xl shadow-lg"
        />
        <div className="text-center">
          <p className="text-white font-bold text-xl tracking-tight">Bubblepi</p>
          <p className="text-white/60 text-sm">Admin Panel</p>
        </div>
      </div>

      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Admin Login
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password admin"
                autoComplete="current-password"
                required
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
