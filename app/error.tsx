"use client"
import { useEffect } from "react"

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center">
      <h2 className="text-2xl font-bold text-red-600">Terjadi Kesalahan</h2>
      <p className="text-gray-600 max-w-md">Maaf, terjadi kesalahan yang tidak terduga. Silakan coba lagi.</p>
      <button onClick={reset} className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors">
        Coba Lagi
      </button>
    </div>
  )
}
