import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center">
      <h2 className="text-6xl font-bold text-pink-400">404</h2>
      <h3 className="text-2xl font-semibold text-gray-800">Halaman Tidak Ditemukan</h3>
      <p className="text-gray-600 max-w-md">Halaman yang kamu cari tidak ada atau sudah dipindahkan.</p>
      <Link href="/" className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors">
        Kembali ke Beranda
      </Link>
    </div>
  )
}
