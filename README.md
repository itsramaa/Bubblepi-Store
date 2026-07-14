# Bubblepi Store

<div align="center">

**Marketplace akun digital premium Indonesia** — Netflix, Spotify, Canva, ChatGPT, dan lainnya.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma)](https://prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-336791?logo=postgresql)](https://neon.tech)
[![Xendit](https://img.shields.io/badge/Xendit-Payment-00599C)](https://xendit.co)
[![Resend](https://img.shields.io/badge/Resend-Email-000000)](https://resend.com)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-000?logo=vercel)](https://bubblepi-store.vercel.app)

[Live Site](https://bubblepi-store.vercel.app) · [Admin Panel](https://bubblepi-store.vercel.app/admin/login) · [Docs](./docs/)

</div>

---

## Deskripsi

Bubblepi Store adalah platform e-commerce digital berbasis Next.js App Router untuk menjual akun digital premium (Netflix, Spotify, Canva, ChatGPT, dll.) secara otomatis. Setelah pembayaran dikonfirmasi oleh Xendit, sistem langsung mengirimkan kredensial akun ke email pembeli — tanpa intervensi manual.

---

## Fitur

### Storefront
- Halaman beranda dengan hero, produk unggulan, testimonial, dan FAQ
- Listing produk dengan filter kategori & pencarian
- Halaman detail produk dengan pemilih varian dan flash sale countdown
- Keranjang belanja dengan localStorage persistence
- Checkout 3 langkah: data → konfirmasi → pembayaran (QRIS / Virtual Account)
- Halaman status pesanan dengan polling otomatis dan reveal kredensial
- Cek pesanan berdasarkan email

### Checkout & Pembayaran
- Integrasi Xendit Invoice API (QRIS 0.7%, Virtual Account Rp 4.000 — ditanggung Xendit)
- Pembayaran otomatis diverifikasi via webhook `x-callback-token`
- Fulfillment otomatis saat pembayaran lunas
- Voucher diskon (PERCENT / FIXED) dengan validasi minimum order dan masa berlaku

### Admin Panel
- Dashboard metrik: pendapatan hari ini / minggu / bulan, pesanan pending, stok kritis
- CRUD produk & varian dengan flash sale scheduling
- Upload stok massal (hingga 500 kredensial per batch, deduplikasi otomatis)
- Manajemen pesanan: fulfill manual, bulk fulfill, export CSV
- Manajemen voucher: buat, aktif/nonaktif
- Moderasi ulasan: tampilkan/sembunyikan, pin
- Manajemen klaim garansi: approve (kirim stok pengganti) / reject

### Email Otomatis (Resend)
- Konfirmasi pesanan + link pembayaran
- Notifikasi pembayaran diterima
- Pengiriman kredensial akun
- Notifikasi pesanan kadaluarsa
- Low stock alert ke admin
- Abandoned cart recovery
- Reminder perpanjangan

### Keamanan
- Rate limiting in-memory pada endpoint sensitif (create-order, payment, voucher, analytics)
- AES-256-GCM encryption untuk semua kredensial di database
- JWT httpOnly cookie untuk sesi admin (8 jam)
- Validasi environment variables saat startup via Zod
- Webhook verification via `x-callback-token`
- Cron jobs dilindungi `CRON_SECRET`

### Analytics & Engagement
- Funnel tracking: VIEW_PRODUCT → ADD_TO_CART → CHECKOUT_START → PAYMENT_INITIATED → PAYMENT_SUCCESS
- Referral system (komisi Rp 5.000 per order)
- Price drop notification
- Live activity feed
- Social proof stats

---

## Screenshots

### Halaman Beranda
*(coming soon)*

### Halaman Produk
*(coming soon)*

### Checkout
*(coming soon)*

### Admin Dashboard
*(coming soon)*

---

## Getting Started

### Prerequisites

- Node.js v24+
- pnpm v9+
- PostgreSQL (Neon direkomendasikan untuk Vercel)
- Akun Xendit (sandbox tersedia gratis)
- Akun Resend (free tier: 3.000 email/bulan)

### Instalasi

```bash
# 1. Clone repo
git clone https://github.com/holycann/Bubblepi-Store.git
cd Bubblepi-Store

# 2. Install dependencies
pnpm install
```

### Setup Environment

```bash
cp .env.example .env.local
# Edit .env.local — isi semua variabel (lihat tabel di bawah)
```

### Setup Database

```bash
# Deploy migrasi ke database
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# (Opsional) Seed data contoh
npx tsx prisma/seed.ts
```

### Jalankan Dev Server

```bash
pnpm dev
# → http://localhost:3000
# → Admin: http://localhost:3000/admin/login
```

---

## Environment Variables

| Variabel | Wajib | Deskripsi |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string. Tambahkan `?pgbouncer=true&connection_limit=1` untuk Vercel/Neon |
| `ADMIN_PASSWORD` | ✅ | Password admin panel (min 8 karakter) |
| `ADMIN_SECRET` | ✅ | Secret untuk signing JWT admin (min 32 karakter) |
| `XENDIT_SECRET_KEY` | ✅ | API key Xendit. `xnd_development_...` untuk sandbox, `xnd_production_...` untuk live |
| `XENDIT_WEBHOOK_TOKEN` | ✅ | Token verifikasi webhook Xendit (`x-callback-token`) |
| `RESEND_API_KEY` | ✅ | API key Resend untuk pengiriman email |
| `RESEND_FROM_EMAIL` | ✅ | Alamat email pengirim (harus terverifikasi di Resend) |
| `NEXT_PUBLIC_APP_URL` | ✅ | URL lengkap aplikasi (contoh: `https://bubblepi-store.vercel.app`) |
| `TELEGRAM_BOT_TOKEN` | ✅ | Token bot Telegram untuk notifikasi pesanan |
| `TELEGRAM_CHAT_ID` | ✅ | Chat ID tujuan notifikasi Telegram |
| `CRON_SECRET` | ✅ | Secret untuk autentikasi cron job (min 16 karakter) |
| `NEXT_PUBLIC_SUPPORT_WHATSAPP` | ✅ | Nomor WhatsApp support (format: `628xxxxxxxxxx`) |
| `ENCRYPTION_KEY` | ✅ | Hex string 64 karakter untuk AES-256-GCM. Generate: `openssl rand -hex 32` |

---

## Arsitektur (Ringkas)

```
Customer/Admin Browser
       │
       ▼
Next.js App Router (Vercel Serverless)
  ├── app/(store)/...     ← Storefront pages
  ├── app/admin/...       ← Admin panel pages
  └── app/api/...         ← API Routes
       │
       ├── PostgreSQL (Neon) via Prisma 6
       ├── Xendit Invoice API  ← pembayaran QRIS/VA
       ├── Resend              ← email transaksional
       └── Telegram Bot        ← notifikasi real-time
```

Lihat [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) untuk diagram lengkap.

---

## Deployment (Vercel)

1. Connect repo `holycann/Bubblepi-Store` di Vercel dashboard
2. Framework preset: **Next.js**
3. Build command: `prisma generate && next build`
4. Install command: `pnpm install`
5. Set semua environment variables di **Settings → Environment Variables**
6. Pastikan `DATABASE_URL` menggunakan Neon/Vercel Postgres dengan pgbouncer

---

## Go-Live Checklist

- [ ] Ganti Xendit ke production: ubah `XENDIT_SECRET_KEY` dari `xnd_development_` ke `xnd_production_`
- [ ] Generate `ENCRYPTION_KEY`: `openssl rand -hex 32`
- [ ] Jalankan migrasi enkripsi kredensial: `npx tsx scripts/encrypt-credentials.ts`
- [ ] Set webhook URL di Xendit dashboard → Settings → Webhooks → `https://yourdomain.com/api/payments/webhook`
- [ ] Set semua env vars di Vercel dashboard
- [ ] Jalankan migrasi DB production: `npx prisma migrate deploy`
- [ ] Verifikasi domain Resend (DNS DKIM/SPF) — cek Resend dashboard
- [ ] Test end-to-end: buat pesanan → bayar (sandbox) → verifikasi email kredensial diterima
- [ ] Verifikasi admin login di `/admin/login`
- [ ] Cek `/api/health` mengembalikan `{ "status": "ok" }`
- [ ] Aktifkan Automatic Rollback di Vercel Production Deployments settings

---

## Rollback

- **Vercel**: Aktifkan Automatic Rollback di Production Deployments settings, atau redeploy commit sebelumnya dari dashboard
- **Database**: `npx prisma migrate resolve --rolled-back <migration-name>` + restore dari Neon point-in-time recovery
- **Enkripsi kredensial**: Jika `ENCRYPTION_KEY` hilang, restore DB dari backup sebelum migrasi enkripsi dijalankan
- **Rate limiting**: In-memory — reset otomatis saat cold start, tidak perlu rollback

---

## Contributing

1. Fork repo
2. Buat branch: `git checkout -b feat/nama-fitur`
3. Commit dengan [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, `chore:`
4. Push & buat Pull Request ke `main`

---

## License

MIT © Bubblepi Store
