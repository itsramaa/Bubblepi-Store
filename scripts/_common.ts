import { PrismaClient } from "@prisma/client"
import { sendTelegramNotification } from "../lib/telegram"

const prisma = new PrismaClient()

export async function notify(message: string) {
  try { await sendTelegramNotification(message) } catch {}
}

export function hoursAgo(h: number) { return new Date(Date.now() - h * 3600000) }
export function daysAgo(d: number) { return new Date(Date.now() - d * 86400000) }

export { prisma }
