# Admin Panel Guide

Panduan lengkap penggunaan admin panel Bubblepi Store.

## Login

URL: `/admin/login`

- Masukkan password dari env `ADMIN_PASSWORD`
- Session berlaku selama 8 jam (JWT, disimpan di cookie `admin_token`)
- Rate limit: 5 percobaan per 15 menit per IP
- Logout via tombol di sidebar atau `POST /api/admin/logout`

## Dashboard

Metrik yang tersedia (dari `GET /api/admin/stats`):

- **Revenue hari ini** — total order status `FULFILLED` sejak 00:00 hari ini
- **Revenue minggu ini** — sejak hari Minggu pekan ini
- **Revenue bulan ini** — sejak tanggal 1 bulan berjalan
- **Total order pending** — jumlah order dengan status `PENDING`, `AWAITING_PAYMENT`, atau `PENDING_STOCK`
- **Produk dengan stok kritis** — variant dengan stok tersedia < 3 (maks 20 ditampilkan, diurutkan dari yang paling kritis)
- **Grafik revenue 30 hari** — via `GET /api/admin/revenue/chart`

## Produk & Variant

### Tambah Produk
Admin → Produk → Tambah Produk

Field yang tersedia:
| Field | Keterangan |
|-------|-----------|
| nama | Nama produk |
| slug | URL-friendly identifier (unik) |
| deskripsi | Deskripsi produk |
| kategori | Kategori (misal: streaming, gaming) |
| gambar | URL gambar produk |
| status aktif | Toggle aktif/nonaktif |

### Tambah Variant
Per produk, field:
| Field | Keterangan |
|-------|-----------|
| nama | Nama variant (misal: "1 Bulan") |
| harga | Harga normal (IDR) |
| durasi | Durasi dalam hari |
| harga sale | Harga diskon (opsional) |
| tanggal akhir sale | Batas waktu harga diskon |

### Edit / Hapus
- `PATCH /api/admin/products/[id]` — update produk
- `DELETE /api/admin/products/[id]` — hapus produk
- `PATCH /api/admin/variants/[id]` — update variant
- `DELETE /api/admin/variants/[id]` — hapus variant

## Manajemen Stok

### Upload Bulk
Admin → Stok → Upload CSV / Bulk Upload

Endpoint: `POST /api/admin/stock/bulk-upload`

Body JSON:
```json
{
  "variantId": "cld123...",
  "credentials": [
    "email1:password1",
    "email2:password2"
  ]
}
```

Batas: **maksimal 500 kredensial per upload**.

Format CSV yang dikonversi ke atas (satu baris per credential):
| variantId | credentials |
|-----------|-------------|
| cld123... | email:pass@gmail.com |
| cld123... | email2:pass2@gmail.com |

Response:
```json
{
  "success": true,
  "data": {
    "inserted": 48,
    "skipped_duplicates": 2,
    "total_submitted": 50
  }
}
```

- Duplikat otomatis dilewati (deduplicate berdasarkan hash enkripsi)
- **Credentials otomatis ter-enkripsi AES-256-GCM saat disimpan**

### Edit Manual
Admin → Stok → klik item stok → edit credentials

Endpoint: `PATCH /api/admin/stock/[id]`

### Lihat Stok
`GET /api/admin/stock` — list semua stok dengan status (`AVAILABLE`, `SOLD`, `RESERVED`)

## Manajemen Order

### List Order
`GET /api/admin/orders`

Filter tersedia:
- Status: `PENDING`, `AWAITING_PAYMENT`, `PAID`, `FULFILLED`, `FAILED`, `EXPIRED`
- Tanggal: range dari–sampai
- Search: email customer atau nomor order

### Fulfill Manual
Klik order → tombol **Fulfill** → sistem assign stock ke customer otomatis.

Endpoint: `PATCH /api/admin/orders/[id]` dengan `{ action: "fulfill" }`

### Bulk Fulfill
Centang multiple orders → tombol **Bulk Fulfill**

Endpoint: `POST /api/admin/orders/bulk-fulfill`

### Export CSV
Tombol **Export** di halaman orders.

Endpoint: `GET /api/admin/orders/export`

## Voucher

Endpoint: `POST /api/admin/vouchers` (buat), `PATCH /api/admin/vouchers` (update)

### Buat Voucher
Field:
| Field | Keterangan |
|-------|-----------|
| code | Kode voucher (unik, auto-uppercase) |
| type | `PERCENT` atau `FIXED` |
| value | Nilai diskon (persen atau nominal IDR) |
| minOrder | Minimum total cart (IDR) |
| maxUses | Batas penggunaan (null = unlimited) |
| expiresAt | Tanggal kedaluwarsa (null = tidak ada batas) |

### Nonaktifkan Voucher
`PATCH /api/admin/vouchers` dengan `{ id, isActive: false }`

Toggle `isActive` bisa dilakukan kapan saja tanpa menghapus data historis.

## Review

Endpoint: `PATCH /api/admin/reviews`

- **Approve**: set `isVisible: true` — review tampil di halaman produk
- **Reject**: set `isVisible: false`
- **Pin**: set `isPinned: true` — review tampil di urutan teratas
- Review hanya bisa dibuat oleh customer dengan order status `FULFILLED` untuk produk tersebut (verified buyer)
- Satu order hanya bisa submit satu review per produk (unique constraint)

## Warranty Claims

Endpoint: `PATCH /api/admin/warranty`

Flow:
1. Customer submit klaim via `POST /api/warranty`
2. Admin melihat list klaim di panel
3. **Approve**: isi `resolveNote` → status berubah ke `APPROVED`
4. **Reject**: isi alasan penolakan → status berubah ke `REJECTED`
5. Email notifikasi otomatis terkirim ke customer setelah update status

## Cron Jobs

Semua cron endpoint membutuhkan header `Authorization: Bearer {CRON_SECRET}`.

| Job | Path | Jadwal | Fungsi |
|-----|------|--------|--------|
| check-expired-orders | `/api/cron/check-expired-orders` | Setiap 5 menit | Expire order yang belum dibayar > 24 jam |
| retry-emails | `/api/cron/retry-emails` | Setiap 15 menit | Kirim ulang email credential yang gagal |
| low-stock-alert | `/api/cron/low-stock-alert` | Setiap 6 jam | Alert stok kritis ke admin via Telegram |
| abandoned-cart | `/api/cron/abandoned-cart` | Setiap 30 menit | Email cart abandonment ke calon pembeli |
| auto-expire | `/api/cron/auto-expire` | Setiap 10 menit | Auto-expire order pending |
| auto-retry | `/api/cron/auto-retry` | Setiap 15 menit | Retry fulfillment yang tertunda |
| auto-cancel | `/api/cron/auto-cancel` | Setiap jam | Cancel order stale |
| auto-cleanup | `/api/cron/auto-cleanup` | Setiap hari 02:00 | Cleanup data lama |
| renewal-reminder | `/api/cron/renewal-reminder` | Setiap hari 09:00 | Reminder renewal ke customer |
| daily-report | `/api/cron/daily-report` | Setiap hari 07:00 | Report harian ke Telegram |
| weekly-summary | `/api/cron/weekly-summary` | Setiap Senin 08:00 | Summary mingguan ke Telegram |
| stok-kritis | `/api/cron/stok-kritis` | Setiap 4 jam | Critical stock check |

Jadwal dikonfigurasi di `vercel.json` → field `crons`.
