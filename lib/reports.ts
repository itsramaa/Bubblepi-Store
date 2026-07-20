/**
 * Reports Generation
 * Daily and monthly report utilities
 */

import { db } from "@/lib/db"

interface DailyReport {
  date: Date
  orders: number
  revenue: number
  warrantyClaims: number
  newWarranties: number
  avgOrderValue: number
}

interface MonthlyReport {
  month: string
  orders: number
  revenue: number
  warrantyClaims: number
  topProducts: Array<{ name: string; count: number }>
}

/**
 * Get daily report data
 */
export async function getDailyReport(date: Date = new Date()): Promise<DailyReport> {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(startOfDay)
  endOfDay.setDate(endOfDay.getDate() + 1)

  const [ordersCount, revenueAgg, claimsCount, warrantiesCount] = await Promise.all([
    db.order.count({
      where: { createdAt: { gte: startOfDay, lt: endOfDay } },
    }),
    db.order.aggregate({
      where: { 
        createdAt: { gte: startOfDay, lt: endOfDay },
        paymentStatus: "PAID",
      },
      _sum: { total: true },
      _avg: { total: true },
    }),
    db.warrantyClaim.count({
      where: { submittedAt: { gte: startOfDay, lt: endOfDay } },
    }),
    db.warranty.count({
      where: { startDate: { gte: startOfDay, lt: endOfDay } },
    }),
  ])

  return {
    date: startOfDay,
    orders: ordersCount,
    revenue: revenueAgg._sum.total || 0,
    warrantyClaims: claimsCount,
    newWarranties: warrantiesCount,
    avgOrderValue: revenueAgg._avg.total || 0,
  }
}

/**
 * Get monthly report data
 */
export async function getMonthlyReport(year: number, month: number): Promise<MonthlyReport> {
  const startOfMonth = new Date(year, month - 1, 1)
  const endOfMonth = new Date(year, month, 1)

  const [orders, warrantyClaims] = await Promise.all([
    db.order.findMany({
      where: { 
        createdAt: { gte: startOfMonth, lt: endOfMonth },
        paymentStatus: "PAID",
      },
      include: {
        items: {
          include: { variant: { include: { product: true } } },
        },
      },
    }),
    db.warrantyClaim.count({
      where: { 
        submittedAt: { gte: startOfMonth, lt: endOfMonth },
      },
    }),
  ])

  const revenue = orders.reduce((sum, o) => sum + o.total, 0)

  // Top products
  const productCount = new Map<string, number>()
  for (const order of orders) {
    for (const item of order.items) {
      const name = item.variant.product.name
      productCount.set(name, (productCount.get(name) || 0) + item.quantity)
    }
  }

  const topProducts = Array.from(productCount.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  const monthName = startOfMonth.toLocaleDateString("id-ID", { month: "long", year: "numeric" })

  return {
    month: monthName,
    orders: orders.length,
    revenue,
    warrantyClaims,
    topProducts,
  }
}

/**
 * Format report for Telegram
 */
export function formatDailyReportTelegram(report: DailyReport): string {
  return (
    `📊 <b>Daily Report</b>\n` +
    `📅 ${report.date.toLocaleDateString("id-ID")}\n\n` +
    `🛒 Orders: <b>${report.orders}</b>\n` +
    `💰 Revenue: <b>Rp ${report.revenue.toLocaleString("id-ID")}</b>\n` +
    `📈 Avg Order: Rp ${Math.round(report.avgOrderValue).toLocaleString("id-ID")}\n\n` +
    `🛡️ Warranty Claims: ${report.warrantyClaims}\n` +
    `✨ New Warranties: ${report.newWarranties}`
  )
}

export function formatMonthlyReportTelegram(report: MonthlyReport): string {
  const topProductsList = report.topProducts
    .map((p, i) => `${i + 1}. ${p.name}: ${p.count}`)
    .join("\n")

  return (
    `📊 <b>Monthly Report</b>\n` +
    `📅 ${report.month}\n\n` +
    `🛒 Total Orders: <b>${report.orders}</b>\n` +
    `💰 Total Revenue: <b>Rp ${report.revenue.toLocaleString("id-ID")}</b>\n\n` +
    `🛡️ Warranty Claims: ${report.warrantyClaims}\n\n` +
    `🏆 Top Products:\n${topProductsList}`
  )
}