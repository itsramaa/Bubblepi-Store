"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useCallback, useTransition } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const ORDER_STATUSES = [
  { value: "ALL", label: "Semua Status" },
  { value: "PENDING", label: "Pending" },
  { value: "AWAITING_PAYMENT", label: "Menunggu Bayar" },
  { value: "PAID", label: "Dibayar" },
  { value: "FULFILLED", label: "Selesai" },
  { value: "FAILED", label: "Gagal" },
  { value: "PENDING_STOCK", label: "Menunggu Stok" },
]

export default function OrderFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (!value || value === "ALL") {
        params.delete(key)
      } else {
        params.set(key, value)
      }
      params.delete("page")
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`)
      })
    },
    [router, pathname, searchParams]
  )

  const status = (searchParams.get("status") ?? "ALL") as string
  const search = (searchParams.get("search") ?? "") as string
  const from = (searchParams.get("from") ?? "") as string
  const to = (searchParams.get("to") ?? "") as string

  return (
    <div className="flex flex-wrap gap-4 items-end">
      <div className="flex flex-col gap-1.5 min-w-[180px]">
        <Label htmlFor="status-filter" className="text-caption-sm text-muted">Status</Label>
        <Select
          value={status || null}
          onValueChange={(val) => updateParam("status", val ?? "ALL")}
        >
          <SelectTrigger id="status-filter" className="h-9">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            {ORDER_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5 min-w-[220px]">
        <Label htmlFor="order-search" className="text-caption-sm text-muted">
          Cari (email / nomor pesanan)
        </Label>
        <Input
          id="order-search"
          className="h-9"
          placeholder="customer@email.com atau BP-XXXXXXXX"
          defaultValue={search}
          onChange={(e) => {
            const val = e.target.value
            if (val === "") updateParam("search", "")
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              updateParam("search", (e.target as HTMLInputElement).value)
            }
          }}
          onBlur={(e) => updateParam("search", e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="date-from" className="text-caption-sm text-muted">Dari tanggal</Label>
        <Input
          id="date-from"
          type="date"
          className="h-9 w-[160px]"
          defaultValue={from}
          onBlur={(e) => updateParam("from", e.target.value)}
          onChange={(e) => {
            if (e.target.value === "") updateParam("from", "")
          }}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="date-to" className="text-caption-sm text-muted">Sampai tanggal</Label>
        <Input
          id="date-to"
          type="date"
          className="h-9 w-[160px]"
          defaultValue={to}
          onBlur={(e) => updateParam("to", e.target.value)}
          onChange={(e) => {
            if (e.target.value === "") updateParam("to", "")
          }}
        />
      </div>
    </div>
  )
}