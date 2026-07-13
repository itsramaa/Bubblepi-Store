import { z } from "zod"

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  ADMIN_PASSWORD: z.string().min(8),
  ADMIN_SECRET: z.string().min(32),
  XENDIT_SECRET_KEY: z.string().min(1),
  XENDIT_WEBHOOK_TOKEN: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  RESEND_FROM_EMAIL: z.string().email(),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  TELEGRAM_CHAT_ID: z.string().min(1),
  CRON_SECRET: z.string().min(16),
  NEXT_PUBLIC_SUPPORT_WHATSAPP: z.string().min(1),
})

export type Env = z.infer<typeof envSchema>

// Validate at module load — throws on missing/invalid vars in production
const _env = envSchema.safeParse(process.env)
if (!_env.success && process.env.NODE_ENV === "production") {
  console.error("❌ Invalid environment variables:", _env.error.flatten().fieldErrors)
  throw new Error("Invalid environment variables")
}

export const env = (process.env as unknown) as Env
