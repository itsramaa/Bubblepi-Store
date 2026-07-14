# Panduan Deployment Bubblepi Store

## Prasyarat

- Akun [Vercel](https://vercel.com) (free tier cukup untuk mulai)
- Akun [Neon](https://neon.tech) untuk PostgreSQL serverless
- Akun [Xendit](https://xendit.co) (sandbox gratis)
- Akun [Resend](https://resend.com) (free tier: 3.000 email/bulan)
- Bot Telegram (buat via [@BotFather](https://t.me/BotFather))
- Node.js v24+, pnpm v9+

---

## 1. Neon PostgreSQL

1. Daftar di [neon.tech](https://neon.tech) → buat project baru
2. Buat database baru (misal: `bubblepi`)
3. Salin **Connection string** dari dashboard Neon
4. **Wajib**: tambahkan parameter pgbouncer ke URL:
   ```
   postgresql://user:pass@host/dbname?sslmode=require&pgbouncer=true&connection_limit=1
   ```
   Parameter ini mencegah pool exhaustion pada Vercel serverless.
5. Simpan sebagai `DATABASE_URL`

---

## 2. Xendit

### Sandbox (Development)
1. Daftar di [dashboard.xendit.co](https://dashboard.xendit.co)
2. Pastikan berada di mode **Sandbox** (toggle di sidebar)
3. Buka **Settings → API Keys** → salin Secret Key (prefix `xnd_development_`)
4. Buka **Settings → Webhooks** → tambah URL webhook:
   ```
   https://your-domain.vercel.app/api/payments/webhook
   ```
5. Salin **Webhook Verification Token** (callback token)

### Production
1. Lengkapi KYC/verifikasi bisnis di Xendit
2. Toggle ke mode **Production** di dashboard
3. Buat Secret Key baru (prefix `xnd_production_`)
4. Update webhook URL ke domain production
5. **Ganti** `XENDIT_SECRET_KEY` ke key production — jangan lupa update di Vercel

---

## 3. Resend Email

1. Daftar di [resend.com](https://resend.com)
2. Buka **Domains** → tambah domain kamu
3. Ikuti instruksi DNS verification (tambahkan record DKIM, SPF, DMARC di DNS provider)
4. Tunggu status domain menjadi **Verified** (biasanya 5-30 menit)
5. Buka **API Keys** → buat API key baru
6. Set `RESEND_FROM_EMAIL` ke alamat di domain yang sudah terverifikasi (misal: `noreply@yourdomain.com`)

> **Catatan**: Tanpa domain terverifikasi, email hanya bisa dikirim ke alamat yang terdaftar di akun Resend (mode sandbox).

---

## 4. Telegram Bot

1. Buka Telegram → cari [@BotFather](https://t.me/BotFather)
2. Kirim `/newbot` → ikuti instruksi → salin **Bot Token**
3. Tambahkan bot ke grup/channel kamu
4. Dapatkan **Chat ID**:
   ```bash
   curl https://api.telegram.org/bot<TOKEN>/getUpdates
   # Kirim pesan ke grup dulu, lalu lihat field "chat.id" di response
   ```
5. Untuk channel: Chat ID biasanya negatif (format: `-1001234567890`)

---

## 5. Enkripsi Kredensial

Generate `ENCRYPTION_KEY` **sebelum** deploy pertama atau sebelum ada data kredensial:

```bash
openssl rand -hex 32
# Output: 64-char hex string
# Contoh: a3f8c2d1e4b5a6f7...
```

Jika sudah ada data plaintext di database, jalankan skrip migrasi enkripsi setelah set `ENCRYPTION_KEY`:

```bash
npx tsx scripts/encrypt-credentials.ts
```

> ⚠️ **Simpan `ENCRYPTION_KEY` di tempat aman.** Jika key hilang, kredensial terenkripsi tidak bisa didekripsi. Selalu backup key ini terpisah dari database.

---

## 6. Vercel Setup

### Deploy Pertama

1. Push repo ke GitHub
2. Buka [vercel.com/new](https://vercel.com/new) → import repo `holycann/Bubblepi-Store`
3. Framework preset: **Next.js** (terdeteksi otomatis)
4. Override build settings:
   - **Build Command**: `prisma generate && next build`
   - **Install Command**: `pnpm install`
   - **Output Directory**: `.next` (default)
5. Klik **Environment Variables** → masukkan semua variabel (lihat tabel di bawah)
6. Klik **Deploy**

### Konfigurasi Cron Jobs

Tambahkan/verifikasi `vercel.json` di root project:

```json
{
  "crons": [
    { "path": "/api/cron/check-expired-orders", "schedule": "0 * * * *" },
    { "path": "/api/cron/retry-emails", "schedule": "*/30 * * * *" },
    { "path": "/api/cron/low-stock-alert", "schedule": "0 8 * * *" },
    { "path": "/api/cron/abandoned-cart", "schedule": "0 * * * *" },
    { "path": "/api/cron/daily-report", "schedule": "0 9 * * *" },
    { "path": "/api/cron/auto-retry", "schedule": "*/15 * * * *" }
  ]
}
```

Vercel akan otomatis mengirim `Authorization: Bearer CRON_SECRET` ke setiap endpoint cron.

---

## 7. Environment Variables — Tabel Lengkap

| Variabel | Contoh Nilai | Detail |
|---|---|---|
| `DATABASE_URL` | `postgresql://user:pass@host/db?pgbouncer=true&connection_limit=1` | Wajib ada `pgbouncer=true&connection_limit=1` untuk Vercel |
| `ADMIN_PASSWORD` | `MyStr0ngP@ss!` | Min 8 karakter. Dipakai untuk login `/admin/login` |
| `ADMIN_SECRET` | `random-32-char-string-here-abcdef` | Min 32 karakter. Dipakai untuk signing JWT admin. Generate: `openssl rand -base64 32` |
| `XENDIT_SECRET_KEY` | `xnd_production_abc123...` | Prefix `xnd_development_` untuk sandbox, `xnd_production_` untuk live |
| `XENDIT_WEBHOOK_TOKEN` | `whsec_abc123...` | Dari Xendit dashboard → Settings → Webhooks |
| `RESEND_API_KEY` | `re_abc123...` | Dari Resend dashboard → API Keys |
| `RESEND_FROM_EMAIL` | `noreply@yourdomain.com` | Harus di domain yang sudah terverifikasi di Resend |
| `NEXT_PUBLIC_APP_URL` | `https://bubblepi-store.vercel.app` | URL tanpa trailing slash. Dipakai untuk link di email |
| `TELEGRAM_BOT_TOKEN` | `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11` | Dari @BotFather |
| `TELEGRAM_CHAT_ID` | `-1001234567890` | Chat/channel ID tujuan notifikasi |
| `CRON_SECRET` | `random-16-char-secret` | Min 16 karakter. Generate: `openssl rand -base64 16` |
| `NEXT_PUBLIC_SUPPORT_WHATSAPP` | `6281234567890` | Format internasional tanpa `+` |
| `ENCRYPTION_KEY` | `a3f8c2d1...` (64 hex chars) | Generate: `openssl rand -hex 32`. **Jangan pernah di-rotate tanpa migrasi data!** |

---

## 8. First Deploy Checklist

```
Infrastructure
[ ] Neon database dibuat, connection string disalin
[ ] pgbouncer=true&connection_limit=1 ada di DATABASE_URL
[ ] Xendit webhook URL dikonfigurasi
[ ] Resend domain terverifikasi
[ ] ENCRYPTION_KEY digenerate dan disimpan aman

Vercel
[ ] Semua 13 env vars dikonfigurasi di Vercel dashboard
[ ] Build command: prisma generate && next build
[ ] Deploy berhasil (tidak ada build error)

Post-Deploy
[ ] GET /api/health mengembalikan { "status": "ok" }
[ ] Admin login berhasil di /admin/login
[ ] Buat produk & upload stok test
[ ] Lakukan test order end-to-end (Xendit sandbox)
[ ] Verifikasi email kredensial diterima
[ ] Verifikasi notifikasi Telegram muncul
[ ] Verifikasi cron jobs berjalan (lihat Vercel → Functions → Cron)
```

---

## 9. Rollback

### Vercel Deployment
```bash
# Via dashboard: Deployments → pilih deployment lama → Promote to Production
# Via CLI:
vercel rollback [deployment-url]
```

### Database Migration
```bash
# Tandai migrasi terakhir sebagai rolled back
npx prisma migrate resolve --rolled-back <migration-name>

# Untuk point-in-time recovery: gunakan Neon dashboard
# Neon → Project → Branches → Restore to point in time
```

### Enkripsi Credentials
Jika `ENCRYPTION_KEY` berubah atau hilang:
1. **Jangan jalankan** aplikasi dengan key baru sebelum migrasi
2. Restore database dari backup Neon ke titik sebelum enkripsi dijalankan
3. Set `ENCRYPTION_KEY` ke nilai yang benar
4. Jalankan ulang `npx tsx scripts/encrypt-credentials.ts`
