"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Upload, FileText, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

interface Props {
  variantId: string
  onSuccess?: (count: number) => void
}

export default function CsvUploadButton({ variantId, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [fileName, setFileName] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setLoading(true)

    try {
      const text = await file.text()
      // Support both CSV (comma/semicolon) and plain text (one per line)
      const lines = text
        .split(/[\r\n]+/)
        .map((l) => l.trim())
        .filter(Boolean)

      // If CSV, try to find a "credentials" column, else treat each line as credential
      let credentials: string[]
      const firstLine = lines[0]?.toLowerCase() ?? ""
      if (firstLine.includes("credential") || firstLine.includes("akun") || firstLine.includes("account")) {
        // Has header — skip first line
        credentials = lines.slice(1)
      } else {
        credentials = lines
      }

      if (credentials.length === 0) {
        toast.error("File kosong atau format tidak valid")
        return
      }

      const res = await fetch("/api/admin/stock/bulk-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId, credentials }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      toast.success(`${data.data.inserted} credentials berhasil diupload`)
      onSuccess?.(data.data.inserted)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Gagal upload")
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.txt"
        className="hidden"
        onChange={handleFile}
      />
      <Button
        variant="outline"
        className="gap-2"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : fileName ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : (
          <Upload className="h-4 w-4" />
        )}
        {loading ? "Mengupload..." : "Upload CSV / TXT"}
      </Button>
      {fileName && !loading && (
        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
          <FileText className="h-3 w-3" /> {fileName}
        </p>
      )}
    </div>
  )
}
