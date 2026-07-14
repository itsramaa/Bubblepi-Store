# API Reference

Base URL: `https://bubblepi-store.vercel.app`

## Authentication

| Tipe | Mekanisme |
|------|-----------|
| Admin endpoints | Cookie `admin_token` (JWT 8 jam) dari `POST /api/admin/auth` |
| Cron endpoints | Header `Authorization: Bearer {CRON_SECRET}` |
| Public endpoints | Tidak perlu auth, tapi ada rate limiting per IP |

Rate limit default untuk public endpoints: tercantum per endpoint di bawah.

---

## Public — Storefront

### Health Check

`GET /api/health`

Response `200`:
```json
{ "status": "ok", "timestamp": "2026-01-01T00:00:00.000Z" }
```

Response `503` (DB unreachable):
```json
{ "status": "error", "message": "DB unreachable" }
```

---

### Products Stock

`GET /api/products/stock?variantIds=id1,id2`

Response:
```json
{ "cld123": 15, "cld456": 0 }
```

---

### Upsell Products

`GET /api/products/upsell?category=streaming&exclude=slug-produk`

Response:
```json
{ "products": [ { "id": "...", "name": "...", "slug": "...", "variants": [...] } ] }
```

---

### Social Proof Stats

`GET /api/stats/social-proof`

Response:
```json
{ "totalOrders": 1200, "totalProducts": 30, "satisfiedCustomers": 1150 }
```

---

### Live Activity

`GET /api/live-activity`

Response:
```json
[{ "firstName": "Budi", "city": "Jakarta", "productName": "Netflix Premium" }]
```

---

### Create Order

`POST /api/orders`

Rate limit: 10 requests/jam per IP.

Body:
```json
{
  "customerName": "Budi Santoso",
  "customerEmail": "budi@email.com",
  "items": [
    { "variantId": "cld123...", "quantity": 1 }
  ],
  "voucherId": "cld456...",
  "discountAmount": 10000
}
```

Response `200`:
```json
{
  "success": true,
  "data": {
    "orderId": "cld789...",
    "orderNumber": "BPS-20260101-XXXX",
    "total": 90000
  }
}
```

Catatan: UTM data dan referral code dibaca otomatis dari cookie (`utm_data`, `ref_code`).

---

### Orders Lookup

`GET /api/orders/lookup?email=budi@email.com`

`POST /api/orders/lookup-by-email`
```json
{ "email": "budi@email.com" }
```

---

### Order Detail

`GET /api/orders/[id]?email=budi@email.com`

---

### Resend Email

`POST /api/orders/[id]/resend-email`
```json
{ "email": "budi@email.com" }
```

---

### Create Payment

`POST /api/payments/create`

Rate limit: 10 requests/jam per IP.

Body:
```json
{
  "orderId": "cld789...",
  "paymentMethod": "VIRTUAL_ACCOUNT",
  "bankCode": "BCA"
}
```

> **Catatan**: endpoint ini menerima `orderId` dari order yang sudah dibuat via `POST /api/orders`. Order harus berstatus `PENDING`.

Response `200`:
```json
{
  "success": true,
  "data": {
    "paymentUrl": "https://checkout.xendit.co/...",
    "invoiceId": "inv-..."
  }
}
```

Error `400`:
```json
{ "error": "Order sudah diproses" }
```

---

### Xendit Webhook

`POST /api/payments/webhook`

Header wajib: `x-callback-token: {XENDIT_WEBHOOK_TOKEN}`

Rate limit: 100 requests/menit per IP.

Body (Xendit callback payload):
```json
{
  "external_id": "BPS-20260101-XXXX",
  "status": "PAID"
}
```

Status yang diproses:
- `PAID` → update order ke `PAID`, kirim email, jalankan `fulfillOrder()`
- `EXPIRED` / `FAILED` → update order ke `FAILED`, kirim email expired

Response `200`:
```json
{ "success": true }
```

Idempotent: jika order sudah `PAID` atau `FULFILLED`, webhook diabaikan dengan `{ "success": true, "skipped": true }`.

---

### Voucher Validate

`POST /api/vouchers/validate`

Rate limit: 20 requests/jam per IP.

Body:
```json
{ "code": "DISKON10", "cartTotal": 100000 }
```

Response `200` (valid):
```json
{
  "valid": true,
  "discount": 10000,
  "voucherId": "cld...",
  "type": "PERCENT",
  "value": 10
}
```

Response `400/404` (tidak valid):
```json
{ "valid": false, "error": "Voucher sudah kedaluwarsa" }
```

Error yang mungkin: `Kode voucher tidak valid` · `Voucher sudah kedaluwarsa` · `Voucher sudah habis` · `Minimum order {nominal}`

---

### Submit Review

`POST /api/reviews`

Body:
```json
{
  "productId": "cld...",
  "orderId": "cld...",
  "rating": 5,
  "comment": "Produk bagus, cepat!"
}
```

Validasi:
- `rating`: integer 1–5
- `comment`: 5–500 karakter
- Order harus berstatus `FULFILLED` dan mengandung produk tersebut (verified buyer)
- Satu order hanya bisa review satu kali per produk

Response `201`:
```json
{ "success": true, "review": { "id": "...", ... } }
```

Error `403`: `"Kamu belum pernah beli produk ini atau order belum selesai"`
Error `409`: `"Kamu sudah menulis ulasan untuk produk ini"`

---

### Get Reviews

`GET /api/reviews?productId=cld...`

Response:
```json
{
  "reviews": [{ "id": "...", "rating": 5, "comment": "...", "createdAt": "..." }],
  "avgRating": 4.8
}
```

Hanya menampilkan review yang `isVisible: true`, maks 50 review terbaru.

---

### Featured Reviews

`GET /api/reviews/featured`

---

### Analytics Event

`POST /api/analytics/event`

Rate limit: 100 requests/menit per IP.

Body:
```json
{
  "sessionId": "sess_abc123",
  "event": "ADD_TO_CART",
  "productId": "cld...",
  "variantId": "cld..."
}
```

Events yang valid:
```
VIEW_PRODUCT | ADD_TO_CART | CHECKOUT_START | PAYMENT_INITIATED | PAYMENT_SUCCESS
```

Response `200`:
```json
{ "success": true }
```

Fire-and-forget — event disimpan ke `FunnelEvent` tanpa blocking response.

---

### Price Drop Notify

`POST /api/notify-me`

Rate limit: 10 requests/menit per IP.

Body:
```json
{
  "email": "budi@email.com",
  "variantId": "cld...",
  "targetPrice": 50000
}
```

`targetPrice` opsional — jika tidak diisi, notifikasi dikirim saat harga turun berapa pun.

Response `200`:
```json
{ "success": true, "message": "Kami akan memberitahu kamu saat harga turun!" }
```

Upsert: jika email+variantId sudah ada, `targetPrice` diupdate dan `notified` di-reset ke `false`.

---

### Referral

`GET /api/referral?code=REF123`

---

### Warranty Claim

`POST /api/warranty`
```json
{ "orderId": "cld...", "orderItemId": "cld...", "description": "Akun tidak bisa login" }
```

---

### Save Cart (Abandoned Cart)

`POST /api/cart/save`
```json
{
  "email": "budi@email.com",
  "name": "Budi",
  "items": [{ "variantId": "cld...", "quantity": 1 }]
}
```

---

## Admin Endpoints

Semua endpoint admin membutuhkan cookie `admin_token` yang valid.

### Auth

| Method | Path | Deskripsi |
|--------|------|-----------|
| `POST` | `/api/admin/auth` | Login — body `{ password }`, set cookie `admin_token` |
| `POST` | `/api/admin/logout` | Logout — hapus cookie `admin_token` |

Rate limit login: 5 percobaan per 15 menit per IP.

### Products

| Method | Path | Deskripsi |
|--------|------|-----------|
| `GET` | `/api/admin/products` | List semua produk beserta variants |
| `POST` | `/api/admin/products` | Buat produk baru |
| `GET` | `/api/admin/products/[id]` | Detail produk |
| `PATCH` | `/api/admin/products/[id]` | Update produk |
| `DELETE` | `/api/admin/products/[id]` | Hapus produk |

### Variants

| Method | Path | Deskripsi |
|--------|------|-----------|
| `GET` | `/api/admin/variants` | List semua variants |
| `POST` | `/api/admin/variants` | Buat variant baru |
| `PATCH` | `/api/admin/variants/[id]` | Update variant |
| `DELETE` | `/api/admin/variants/[id]` | Hapus variant |

### Stock

| Method | Path | Deskripsi |
|--------|------|-----------|
| `GET` | `/api/admin/stock` | List stok dengan filter status/variantId |
| `POST` | `/api/admin/stock` | Tambah stok satuan |
| `GET` | `/api/admin/stock/[id]` | Detail item stok |
| `PATCH` | `/api/admin/stock/[id]` | Update credentials item stok |
| `DELETE` | `/api/admin/stock/[id]` | Hapus item stok |
| `POST` | `/api/admin/stock/bulk-upload` | Upload bulk credentials (maks 500 per request) |

Bulk upload body:
```json
{ "variantId": "cld...", "credentials": ["email1:pass1", "email2:pass2"] }
```

### Orders

| Method | Path | Deskripsi |
|--------|------|-----------|
| `GET` | `/api/admin/orders` | List order dengan filter status/tanggal/search |
| `GET` | `/api/admin/orders/[id]` | Detail order |
| `PATCH` | `/api/admin/orders/[id]` | Update order (misal manual fulfill) |
| `GET` | `/api/admin/orders/export` | Export order ke CSV |
| `POST` | `/api/admin/orders/bulk-fulfill` | Bulk fulfill multiple orders |

### Stats & Revenue

| Method | Path | Deskripsi |
|--------|------|-----------|
| `GET` | `/api/admin/stats` | Dashboard stats (revenue hari ini/minggu/bulan, pending, low stock) |
| `GET` | `/api/admin/revenue/chart` | Data grafik revenue 30 hari |

Stats response:
```json
{
  "pending": 12,
  "revenue": { "today": 500000, "week": 3200000, "month": 12000000 },
  "lowStockVariants": [{ "id": "...", "name": "Netflix 1 Bulan", "available": 1 }]
}
```

### Vouchers

| Method | Path | Deskripsi |
|--------|------|-----------|
| `POST` | `/api/admin/vouchers` | Buat voucher baru |
| `PATCH` | `/api/admin/vouchers` | Update voucher (toggle isActive, dsb) |

### Reviews

| Method | Path | Deskripsi |
|--------|------|-----------|
| `PATCH` | `/api/admin/reviews` | Approve/reject/pin review |

### Warranty

| Method | Path | Deskripsi |
|--------|------|-----------|
| `PATCH` | `/api/admin/warranty` | Approve/reject warranty claim dengan resolveNote |

---

## Cron Endpoints

Semua cron endpoint membutuhkan header `Authorization: Bearer {CRON_SECRET}`.

| Method | Path | Jadwal | Deskripsi |
|--------|------|--------|-----------|
| `GET` | `/api/cron/check-expired-orders` | `*/5 * * * *` | Expire unpaid orders > 24 jam |
| `GET` | `/api/cron/retry-emails` | `*/15 * * * *` | Retry pengiriman email credential yang gagal |
| `GET` | `/api/cron/low-stock-alert` | `0 */6 * * *` | Alert admin via Telegram untuk stok kritis |
| `GET` | `/api/cron/abandoned-cart` | `*/30 * * * *` | Kirim email abandoned cart |
| `GET` | `/api/cron/auto-expire` | `*/10 * * * *` | Auto-expire order pending |
| `GET` | `/api/cron/auto-retry` | `*/15 * * * *` | Retry fulfillment yang pending |
| `GET` | `/api/cron/auto-cancel` | `0 * * * *` | Cancel order stale |
| `GET` | `/api/cron/auto-cleanup` | `0 2 * * *` | Cleanup data lama |
| `GET` | `/api/cron/renewal-reminder` | `0 9 * * *` | Kirim reminder renewal ke customer |
| `GET` | `/api/cron/daily-report` | `0 7 * * *` | Report harian ke Telegram |
| `GET` | `/api/cron/weekly-summary` | `0 8 * * 1` | Summary mingguan ke Telegram |
| `GET` | `/api/cron/stok-kritis` | `0 */4 * * *` | Critical stock check |

Semua cron endpoint mengembalikan `{ "success": true, "processed": N }`.

---

## Error Format

Semua error menggunakan format konsisten:

```json
{ "error": "Pesan error yang deskriptif" }
```

| Status | Arti |
|--------|------|
| `400` | Request tidak valid / data tidak lengkap |
| `401` | Tidak terautentikasi |
| `403` | Tidak punya akses (misal review tanpa order FULFILLED) |
| `404` | Resource tidak ditemukan |
| `409` | Konflik data (duplikat) |
| `429` | Rate limit tercapai — cek header `Retry-After` |
| `500` | Internal server error |
| `503` | Service unavailable (misal DB unreachable) |
