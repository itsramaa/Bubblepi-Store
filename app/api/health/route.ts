import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { envSchema } from "@/lib/env"

export async function GET() {
  const checks: {
    status: "ok" | "degraded"
    timestamp: string
    db: "ok" | "error" | "unknown"
    env: "ok" | "invalid" | "unknown"
  } = {
    status: "ok",
    timestamp: new Date().toISOString(),
    db: "unknown",
    env: "unknown",
  }

  try {
    await db.$queryRaw`SELECT 1`
    checks.db = "ok"
  } catch {
    checks.db = "error"
    checks.status = "degraded"
  }

  const envValid = envSchema.safeParse(process.env).success
  checks.env = envValid ? "ok" : "invalid"
  if (!envValid) checks.status = "degraded"

  return NextResponse.json(checks, { status: checks.status === "ok" ? 200 : 503 })
}
