export function parseDurationDays(duration: string): number {
  const d = duration.toLowerCase()
  if (d.includes("tahun")) return 365
  if (d.includes("6 bul")) return 180
  if (d.includes("3 bul")) return 90
  if (d.includes("2 bul")) return 60
  if (d.includes("1 bul") || d.includes("bulan")) return 30
  if (d.includes("minggu")) return 7
  if (d.includes("hari")) {
    const m = d.match(/(\d+)/)
    return m ? parseInt(m[1]) : 30
  }
  return 30
}