/**
 * Admin Pricelist Generator - Client Component
 */

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface PricelistItem {
  product: string
  variant: string
  price: number
  stock: number
}

export default function PricelistPage() {
  const [pricelist, setPricelist] = useState<PricelistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [copyStatus, setCopyStatus] = useState("")

  useEffect(() => {
    fetch("/api/admin/pricelist?format=json")
      .then((res) => res.json())
      .then(setPricelist)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const formatText = () => {
    const lines: string[] = []
    let currentProduct = ""
    for (const item of pricelist) {
      if (item.product !== currentProduct) {
        lines.push(`\n${item.product}`)
        currentProduct = item.product
      }
      lines.push(`• ${item.variant}: Rp ${item.price.toLocaleString("id-ID")} (Stock: ${item.stock})`)
    }
    return lines.join("\n")
  }

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(formatText())
    setCopyStatus("Copied!")
    setTimeout(() => setCopyStatus(""), 2000)
  }

  if (loading) return <div className="container p-6">Loading...</div>

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Price List</h1>
        <a href="/admin/dashboard"><Button variant="outline">← Back</Button></a>
      </div>

      <div className="flex gap-2 mb-4">
        <Button onClick={copyToClipboard}>
          {copyStatus || "Copy to Clipboard"}
        </Button>
        <a href="/api/admin/pricelist?format=json" target="_blank" rel="noopener">
          <Button variant="outline">Export JSON</Button>
        </a>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {pricelist.map((item, idx) => (
          <Card key={idx}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{item.product}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{item.variant}</p>
              <p className="text-lg font-bold">Rp {item.price.toLocaleString("id-ID")}</p>
              <p className="text-sm text-muted-foreground">Stock: {item.stock}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}