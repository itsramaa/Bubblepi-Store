/**
 * Admin Supplier Management
 */

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { goAPI } from "@/lib/api-client"

interface Supplier {
  id: string
  name: string
  type: string
  config: Record<string, string>
  priority: number
  isActive: boolean
  createdAt: string
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: "", type: "TELEGRAM", config: "", priority: "1" })

  const fetchSuppliers = () => {
    fetch(goAPI("/api/admin/suppliers"), { credentials: "include" })
      .then((res) => res.json())
      .then(setSuppliers)
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchSuppliers()
  }, [])

  const toggleActive = async (id: string, current: boolean) => {
    await fetch(goAPI(`/api/admin/suppliers/${id}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
      credentials: "include",
    })
    toast.success("Status supplier diperbarui")
    fetchSuppliers()
  }

  const createSupplier = async () => {
    if (!form.name.trim()) {
      toast.error("Nama supplier harus diisi")
      return
    }

    let config: Record<string, string> = {}
    if (form.config.trim()) {
      try {
        config = JSON.parse(form.config)
      } catch {
        toast.error("Format JSON config tidak valid")
        return
      }
    }

    try {
      const res = await fetch(goAPI("/api/admin/suppliers"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, priority: parseInt(form.priority), config }),
        credentials: "include",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Gagal membuat supplier")

      toast.success("Supplier berhasil ditambahkan")
      setShowForm(false)
      setForm({ name: "", type: "TELEGRAM", config: "", priority: "1" })
      fetchSuppliers()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal membuat supplier")
    }
  }

  const testConnection = async (id: string) => {
    try {
      const res = await fetch(goAPI(`/api/admin/suppliers/${id}/test`), { method: "POST", credentials: "include" })
      const data = await res.json()
      if (data.success) {
        toast.success("Koneksi berhasil!")
      } else {
        toast.error(`Koneksi gagal: ${data.error}`)
      }
    } catch {
      toast.error("Gagal menguji koneksi")
    }
  }

  if (loading) return <div className="container p-6">Loading...</div>

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Suppliers</h1>
        <div className="flex gap-2">
          <Button onClick={() => setShowForm(!showForm)}>{showForm ? "Cancel" : "+ Add Supplier"}</Button>
          <a href="/admin/dashboard"><Button variant="outline">← Back</Button></a>
        </div>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader><CardTitle>New Supplier</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Supplier name" />
            </div>
            <div>
              <Label>Type</Label>
              <select className="w-full p-2 border rounded" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="TELEGRAM">Telegram Bot</option>
                <option value="API">HTTP API</option>
              </select>
            </div>
            <div>
              <Label>Priority (1 = highest)</Label>
              <Input type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} />
            </div>
            <div>
              <Label>Config (JSON)</Label>
              <Input value={form.config} onChange={(e) => setForm({ ...form, config: e.target.value })} placeholder='{"botToken": "...", "chatId": "..."}' />
            </div>
            <Button onClick={createSupplier}>Create</Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {suppliers.map((supplier) => (
          <Card key={supplier.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{supplier.name}</CardTitle>
              <Badge variant={supplier.isActive ? "default" : "secondary"}>
                {supplier.isActive ? "Active" : "Inactive"}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm">Type: {supplier.type}</p>
              <p className="text-sm">Priority: {supplier.priority}</p>
              <div className="flex gap-2 mt-4">
                <Button size="sm" variant="outline" onClick={() => toggleActive(supplier.id, supplier.isActive)}>
                  {supplier.isActive ? "Disable" : "Enable"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => testConnection(supplier.id)}>Test</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {suppliers.length === 0 && !loading && (
        <p className="text-center text-muted-foreground">No suppliers yet</p>
      )}
    </div>
  )
}