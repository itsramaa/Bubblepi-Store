# BubblePI Store — Full Specification

> **Version:** 1.0  
> **Last Updated:** 2026-07-20  
> **Status:** Draft - Menunggu Approval

---

## 1. Overview

**BubblePI Store** adalah e-commerce platform untuk menjual akun premium (Netflix, Spotify, Disney+, dll) dengan fitur warranty, multi-supplier integration, dan full automation.

**Target Pengguna:**
- **Guest:** Pembeli tanpa login
- **User:** Pembeli yang login (akses testimonial, history, warranty)
- **Admin:** Pengelola toko (1-2 orang)

---

## 2. User Flows

### 2.1 Guest Checkout Flow

```
1. Guest browse produk
2. Pilih produk → variant → warranty option
3. Klik checkout
4. Isi form delivery (email, nama)
5. Pilih payment method (QRIS/VA)
6. Bayar via Xendit
7. Dapat invoice ID → wait for payment
8. Payment confirmed → SYSTEM: trigger auto-order ke supplier
9. Supplier response → SYSTEM: send email + update stock
10. Customer dapat akun via email
11. Done
```

### 2.2 User Checkout Flow

```
1. User login
2. Browse produk
3. Pilih produk → variant → warranty option
4. Klik checkout (data delivery pre-filled)
5. Pilih payment method
6. Bayar
7. ... (lanjutan sama seperti guest step 7-11)
```

### 2.3 Manual Order Flow (Temen/Gaptek)

```
1. Customer luar web order ke admin via WA/TC
2. Admin proses manual (chat supplier, dll)
3. Admin deliver akun ke customer
4. Admin input ke sistem:
   - Nama customer
   - Email customer
   - Produk + Variant
   - Warranty option (jika dibeli)
   - Harga yang dibayar
   - Bukti gambar (screenshot deliver)
5. Sistem buat order + record warranty
6. Customer dapat notif (opsional)
```

### 2.4 Warranty Claim Flow

```
1. Customer login → ke dashboard
2. Pilih order yang mau diklaim
3. Klik "Claim Garansi"
4. Upload screenshot bukti error
5. Submit → status: PENDING_REVIEW
6. Admin review:
   - Approved → auto order ke supplier → deliver akun baru
   - Rejected → status: REJECTED + alasan
7. Customer dapat notif hasil klaim
```

### 2.5 Auto-Order to Supplier Flow

```
1. Payment confirmed (webhook)
2. SYSTEM: Create order with status PROCESSING
3. SYSTEM: Lock stock (Available → Hold)
4. SYSTEM: Send request ke supplier:
   - Adapter A: Kirim pesan ke Telegram bot
   - Adapter B: POST ke API supplier
5. SUPPLIER RESPONSE:
   a. Success → dapat akun → deliver ke customer → stock: Hold → Sold
   b. Failed/Offline → retry up to 3x with exponential backoff
   c. All failed → notify admin via Telegram + notify customer via email
6. TIMEOUT: Jika > 5 menit ga dapat akun → notify admin manual check needed
```

---

## 3. Auth System

### 3.1 User Types

| Type | Register | Login | Akses |
|------|----------|-------|-------|
| Guest | ❌ | ❌ | Browse, checkout, track order via link |
| User | ✅ | ✅ | Testimonial, order history, warranty status |
| Admin | ❌ | ✅ | Dashboard, all orders, warranty claims, settings |

### 3.2 Auth Implementation

```
Credentials: JWT (httpOnly, Secure, SameSite=Strict)
Session: 8 jam expiry
Refresh: Automatic via refresh token
Password: Bcrypt hash
```

### 3.3 API Routes Protection

| Route | Guest | User | Admin |
|-------|-------|------|-------|
| GET /products | ✅ | ✅ | ✅ |
| POST /checkout | ✅ | ✅ | ❌ |
| GET /order/:id | ✅* | ✅ | ✅ |
| GET /dashboard | ❌ | ✅ | ❌ |
| GET /admin/orders | ❌ | ❌ | ✅ |
| POST /admin/warranty/:id/approve | ❌ | ❌ | ✅ |

*Guest hanya bisa akses order miliknya sendiri via order ID

---

## 4. Product & Stock

### 4.1 Product Model

```typescript
Product {
  id: string
  supplierId: string
  name: string // "Netflix"
  category: string // "Streaming"
  description: string
  imageUrl: string
  isActive: boolean // Admin bisa toggle display
  warrantyOptions: WarrantyOption[]
  createdAt: Date
  updatedAt: Date
}

Variant {
  id: string
  productId: string
  name: string // "1 Bulan", "1 Tahun"
  price: number // IDR, dari Sheets
  supplierVariantId: string // ID di supplier
}

WarrantyOption {
  id: string
  productId: string
  duration: number // hari: 0, 7, 30
  price: number // IDR, dari Sheets
  terms: string // S&K per produk
}
```

### 4.2 Stock Model

```typescript
AccountStock {
  id: string
  variantId: string
  credentials: string // AES-256 encrypted
  status: 'AVAILABLE' | 'HOLD' | 'SOLD'
  supplierId: string
  acquiredAt: Date
  soldAt: Date | null
}
```

### 4.3 Stock Status Flow

```
AVAILABLE → (order paid) → HOLD → (delivered) → SOLD
                              ↓
                        (payment expired/cancelled) → AVAILABLE
```

### 4.4 Auto Stock Update Logic

```typescript
async function handleDelivery(orderId: string, credentials: string) {
  // 1. Update order status
  await db.order.update({
    where: { id: orderId },
    data: { status: 'DELIVERED' }
  })

  // 2. Update stock: HOLD → SOLD
  await db.accountStock.updateMany({
    where: { orderId },
    data: { status: 'SOLD', soldAt: new Date() }
  })

  // 3. Send email ke customer
  await sendDeliveryEmail(order.email, credentials)
}
```

---

## 5. Supplier Integration

### 5.1 Architecture: Adapter Pattern

```
lib/
  suppliers/
    index.ts          # Factory: getSupplier(supplierId)
    base.ts           # Interface SupplierAdapter
    telegram-bot.ts   # Adapter: Telegram bot suppliers
    api-http.ts       # Adapter: Web API suppliers
    barbar-store.ts   # Implementation: BarbarStore
    sekolokopoii.ts   # Implementation: Sekolokopoii
```

### 5.2 Supplier Adapter Interface

```typescript
interface SupplierAdapter {
  supplierId: string
  name: string

  // Cek ketersediaan produk
  checkAvailability(variantId: string): Promise<boolean>

  // Pesan akun
  orderAccount(variantId: string, quantity: number): Promise<OrderResult>

  // Parse response ke format standar
  parseResponse(raw: any): ParsedAccount
}

interface OrderResult {
  success: boolean
  accounts?: string[]
  error?: string
  retryable?: boolean
}

interface ParsedAccount {
  credentials: string // email:password atau format lain
  expiresAt?: Date
  notes?: string
}
```

### 5.3 Auto-Retry Logic

```typescript
async function orderWithRetry(supplier: SupplierAdapter, variantId: string) {
  const maxRetries = 3
  const baseDelay = 5000 // 5 detik

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await supplier.orderAccount(variantId, 1)

      if (result.success) return result

      if (!result.retryable) {
        // Error ga bisa di-retry, langsung fail
        await notifyAdmin(`Supplier ${supplier.name} error: ${result.error}`)
        return result
      }
    } catch (e) {
      // Network error
    }

    if (attempt < maxRetries) {
      const delay = baseDelay * Math.pow(2, attempt - 1) // 5s, 10s, 20s
      await sleep(delay)
    }
  }

  // All retries failed
  await notifyAdmin(`Supplier ${supplier.name} failed after ${maxRetries} retries`)
  await notifyCustomer(orderId, 'Order membutuhkan waktu lebih lama, tim sedang proses manual')

  return { success: false, error: 'All retries failed' }
}
```

### 5.4 Supplier Fallback Logic

```typescript
async function orderWithFallback(variantId: string, orderId: string) {
  const suppliers = await getAvailableSuppliers(variantId)

  for (const supplier of suppliers) {
    const result = await orderWithRetry(supplier, variantId)
    if (result.success) return result
  }

  // Semua supplier gagal
  await notifyAdmin(`All suppliers failed untuk variant ${variantId}`)
  return { success: false, error: 'Stok habis' }
}

function getAvailableSuppliers(variantId: string): SupplierAdapter[] {
  // Urutkan: primary → secondary
  // Skip yang sedang offline
}
```

### 5.5 Polling Logic

```typescript
async function pollForAccount(supplier: SupplierAdapter, variantId: string, timeoutMs = 300000) {
  const startTime = Date.now()

  while (Date.now() - startTime < timeoutMs) {
    const result = await supplier.orderAccount(variantId, 1)

    if (result.success) return result

    // Wait 5 detik sebelum retry
    await sleep(5000)
  }

  // Timeout
  return { success: false, error: 'Polling timeout' }
}
```

---

## 6. Payment (Xendit)

### 6.1 Payment Flow

```
1. Customer pilih payment method
2. SYSTEM: Create invoice via Xendit API
3. Xendit return: invoice URL, expiry time
4. CustomerRedirect ke payment page
5. Customer pay
6. Xendit webhook → SYSTEM: update order status
7. SYSTEM: trigger auto-order to supplier
```

### 6.2 Xendit Integration

```typescript
// Create Invoice
const invoice = await xendit.invoice.create({
  external_id: orderId,
  amount: totalAmount,
  payment_methods: ['QRIS', 'VIRTUAL_ACCOUNT'],
  customer: {
    email: customerEmail
  },
  callback_url: `${APP_URL}/api/webhooks/xendit`,
  success_redirect_url: `${APP_URL}/order/${orderId}?status=success`,
  failure_redirect_url: `${APP_URL}/order/${orderId}?status=failed`
})
```

### 6.3 Webhook Handler

```typescript
// POST /api/webhooks/xendit
async function handleXenditWebhook(req: Request) {
  const signature = req.headers.get('x-callback-token')

  // Validate webhook token
  if (signature !== process.env.XENDIT_WEBHOOK_TOKEN) {
    return Response.json({ error: 'Invalid token' }, { status: 401 })
  }

  const { external_id, status, payment_method } = await req.json()

  const order = await db.order.findUnique({ where: { id: external_id } })

  if (!order) return Response.json({ error: 'Order not found' }, { status: 404 })

  switch (status) {
    case 'PAID':
    case 'SETTLED':
      await handlePaymentSuccess(order.id)
      break
    case 'EXPIRED':
      await handlePaymentExpired(order.id)
      break
    case 'FAILED':
      await handlePaymentFailed(order.id)
      break
  }

  return Response.json({ success: true })
}
```

### 6.4 Payment Expiry Handling

| Method | Xendit Default | Custom (Optional) |
|--------|----------------|-------------------|
| QRIS | 30 menit | - |
| VA | 24 jam | - |

Xendit handle automatically. Jika expired → order status "EXPIRED" → customer harus order ulang.

---

## 7. Warranty System

### 7.1 Warranty Options

| Option | Duration | Price |
|--------|----------|-------|
| Tanpa Garansi | 0 hari | Rp 0 |
| Garansi 7 Hari | 7 hari | Fixed price dari Sheets |
| Garansi 30 Hari | 30 hari | Fixed price dari Sheets |

**Contoh:**
- Netflix 1 Bulan: Tanpa = Rp 25.000, 7 hari = +Rp 5.000, 30 hari = +Rp 15.000

### 7.2 Warranty Record

```typescript
Warranty {
  id: string
  orderId: string
  productId: string
  variantId: string
  warrantyOptionId: string // 0, 7, 30 hari
  duration: number
  startDate: Date // tanggal delivery
  expiryDate: Date // startDate + duration
  status: 'ACTIVE' | 'CLAIMED' | 'EXPIRED'
  claimCount: number // max 1x per warranty
}
```

### 7.3 Warranty Status Logic

```typescript
function updateWarrantyStatus(warranty: Warranty): Warranty {
  if (warranty.status === 'CLAIMED') return warranty
  if (warranty.claimCount >= 1) return warranty

  const now = new Date()
  if (now > warranty.expiryDate) {
    return { ...warranty, status: 'EXPIRED' }
  }

  return warranty
}
```

### 7.4 Warranty Claim Flow

```typescript
// POST /api/warranty/claim
async function submitClaim(orderId: string, userId: string, proofImage: File) {
  // 1. Validate: user punya order ini
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { warranty: true }
  })

  if (!order || order.userId !== userId) {
    throw new Error('Order tidak ditemukan')
  }

  // 2. Validate: warranty masih aktif
  if (!order.warranty || order.warranty.status !== 'ACTIVE') {
    throw new Error('Garansi sudah expired atau tidak tersedia')
  }

  // 3. Validate: belum pernah klaim
  if (order.warranty.claimCount >= 1) {
    throw new Error('Garansi sudah pernah diklaim')
  }

  // 4. Upload proof image
  const proofUrl = await uploadToStorage(proofImage)

  // 5. Create claim
  const claim = await db.warrantyClaim.create({
    data: {
      warrantyId: order.warranty.id,
      proofImageUrl: proofUrl,
      status: 'PENDING_REVIEW',
      submittedAt: new Date()
    }
  })

  // 6. Notify admin
  await notifyAdminTelegram(`Warranty claim baru untuk order ${orderId}`)

  return claim
}
```

### 7.5 Proof Image Expiry (1×24 Jam)

```typescript
// Cron job: setiap 10 menit
async function checkProofExpiry() {
  const claims = await db.warrantyClaim.findMany({
    where: {
      status: 'PENDING_REVIEW',
      submittedAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    }
  })

  for (const claim of claims) {
    // Auto-expire: tidak ada bukti dalam 24 jam
    await db.warrantyClaim.update({
      where: { id: claim.id },
      data: {
        status: 'EXPIRED',
        rejectionReason: 'Bukti tidak dikirim dalam 1×24 jam'
      }
    })

    // Update warranty: mark as expired
    await db.warranty.update({
      where: { id: claim.warrantyId },
      data: { status: 'EXPIRED' }
    })

    // Notify customer
    const order = await db.order.findUnique({
      where: { id: claim.warranty.orderId },
      include: { user: true }
    })
    await sendEmail(order.user.email, 'Warranty Expired', 'Bukti tidak dikirim dalam 1×24 jam')
  }
}
```

### 7.6 Warranty Admin Review

```typescript
// POST /api/admin/warranty/:id/review
async function reviewClaim(claimId: string, adminId: string, action: 'APPROVE' | 'REJECT', reason?: string) {
  const claim = await db.warrantyClaim.findUnique({
    where: { id: claimId },
    include: { warranty: { include: { order: true } } }
  })

  if (!claim || claim.status !== 'PENDING_REVIEW') {
    throw new Error('Claim tidak valid')
  }

  if (action === 'REJECT') {
    await db.warrantyClaim.update({
      where: { id: claimId },
      data: { status: 'REJECTED', rejectionReason: reason }
    })

    await sendEmail(claim.warranty.order.user.email, 'Warranty Ditolak', reason)
  }

  if (action === 'APPROVE') {
    // Auto-order replacement
    const replacement = await orderWithFallback(
      claim.warranty.variantId,
      claim.warranty.order.id
    )

    if (replacement.success) {
      await db.warrantyClaim.update({
        where: { id: claimId },
        data: { status: 'APPROVED' }
      })

      await db.warranty.update({
        where: { id: claim.warranty.id },
        data: { status: 'CLAIMED', claimCount: { increment: 1 } }
      })

      // Deliver replacement
      await sendDeliveryEmail(
        claim.warranty.order.user.email,
        replacement.credentials
      )
    } else {
      // Gagal order replacement
      await db.warrantyClaim.update({
        where: { id: claimId },
        data: {
          status: 'REJECTED',
          rejectionReason: 'Supplier tidak tersedia, please contact admin'
        }
      })
    }
  }

  // Log admin action
  await createAuditLog(adminId, 'WARRANTY_REVIEW', { claimId, action, reason })
}
```

---

## 8. Delivery

### 8.1 Auto Delivery Email

```typescript
async function deliverAccount(orderId: string, credentials: string) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { user: true }
  })

  // 1. Update order status
  await db.order.update({
    where: { id: orderId },
    data: { status: 'DELIVERED', deliveredAt: new Date() }
  })

  // 2. Update stock: HOLD → SOLD
  await db.accountStock.updateMany({
    where: { orderId },
    data: { status: 'SOLD', soldAt: new Date() }
  })

  // 3. Send email
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL,
    to: order.user.email,
    subject: `Pesanan ${order.id} - Akun Anda`,
    html: renderDeliveryEmail(order, credentials)
  })

  // 4. Start warranty timer (jika ada warranty)
  if (order.warrantyId) {
    const warranty = await db.warranty.findUnique({
      where: { id: order.warrantyId }
    })
    if (warranty && warranty.duration > 0) {
      await db.warranty.update({
        where: { id: warranty.id },
        data: {
          startDate: new Date(),
          expiryDate: addDays(new Date(), warranty.duration),
          status: 'ACTIVE'
        }
      })
    }
  }
}

function renderDeliveryEmail(order: Order, credentials: string): string {
  return `
    <h1>Pesanan Selesai!</h1>
    <p>Order ID: ${order.id}</p>
    <p>Produk: ${order.product.name} - ${order.variant.name}</p>
    <pre>${credentials}</pre>
    <p>Simpan baik-baik akun Anda.</p>
    ${order.warranty ? `<p>Garansi aktif sampai: ${order.warranty.expiryDate}</p>` : ''}
  `
}
```

### 8.2 Customer Form (Guest Checkout)

```typescript
// Checkout form untuk guest
const checkoutSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  phone: z.string().optional(),
  productId: z.string(),
  variantId: z.string(),
  warrantyOptionId: z.string().optional(),
  paymentMethod: z.enum(['QRIS', 'VIRTUAL_ACCOUNT'])
})
```

---

## 9. Data Sync

### 9.1 Google Sheets Sync

```typescript
// lib/sync/sheets.ts
interface SheetRow {
  productName: string
  variantName: string
  price: number
  warranty7Days: number
  warranty30Days: number
  supplierId: string
  terms?: string
}

async function syncPricesFromSheets() {
  const sheets = await getSheetsClient()
  const values = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Prices!A2:H'
  })

  const rows = parseSheetValues(values.data.values)

  for (const row of rows) {
    // Upsert product
    const product = await db.product.upsert({
      where: { supplierId_productName: { supplierId: row.supplierId, productName: row.productName } },
      create: { name: row.productName, supplierId: row.supplierId, isActive: true },
      update: {}
    })

    // Upsert variant
    await db.variant.upsert({
      where: { productId_variantName: { productId: product.id, variantName: row.variantName } },
      create: {
        productId: product.id,
        name: row.variantName,
        price: row.price,
        supplierVariantId: row.supplierId + '_' + row.variantName
      },
      update: { price: row.price }
    })

    // Upsert warranty options
    await db.warrantyOption.upsert({
      where: { productId_duration: { productId: product.id, duration: 7 } },
      create: { productId: product.id, duration: 7, price: row.warranty7Days },
      update: { price: row.warranty7Days }
    })

    await db.warrantyOption.upsert({
      where: { productId_duration: { productId: product.id, duration: 30 } },
      create: { productId: product.id, duration: 30, price: row.warranty30Days },
      update: { price: row.warranty30Days }
    })
  }
}
```

### 9.2 Cron Schedule

| Task | Schedule |
|------|----------|
| Price Sync | Setiap 2 jam |
| Stock Alert Check | Setiap 15 menit |
| Warranty Expiry Check | Setiap 1 jam |
| Proof Image Expiry Check | Setiap 10 menit |
| Daily Report | Every day 08:00 |
| Monthly Report | Every 1st of month 09:00 |

---

## 10. Notifications

### 10.1 Notification Channels

| Channel | Use Case |
|---------|----------|
| Email | Delivery, warranty claim, reports |
| Telegram | Admin alerts (stock low, supplier failed, claim baru) |
| Web (in-app) | Order status updates (future) |

### 10.2 Admin Telegram Notifications

```typescript
async function notifyAdminTelegram(message: string) {
  const bot = new TelegramBot(process.env.TELEGRAM_ADMIN_BOT_TOKEN)

  await bot.sendMessage(process.env.TELEGRAM_ADMIN_CHAT_ID, message, {
    parse_mode: 'HTML'
  })
}
```

**Triggers:**
- New order
- Payment confirmed
- Supplier failed (setelah retry)
- Stock < threshold
- New warranty claim
- Daily/Monthly report

### 10.3 Customer Email Notifications

| Trigger | Email Subject |
|---------|---------------|
| Order created | Pesanan Diterima - ${orderId} |
| Payment confirmed | Pembayaran Berhasil - ${orderId} |
| Delivery | Pesanan Selesai - Akun Anda |
| Warranty submitted | Klaim Garansi Diterima |
| Warranty approved | Garansi Disetujui - Akun Pengganti |
| Warranty rejected | Garansi Ditolak |
| Proof expired | Garansi Expired |

---

## 11. Security

### 11.1 Credentials Encryption

```typescript
// lib/crypto.ts
import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY! // 32 bytes
const IV_LENGTH = 16

function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv)
  let encrypted = cipher.update(text)
  encrypted = Buffer.concat([encrypted, cipher.final()])
  return iv.toString('hex') + ':' + encrypted.toString('hex')
}

function decrypt(text: string): string {
  const [ivHex, encryptedHex] = text.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const encrypted = Buffer.from(encryptedHex, 'hex')
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv)
  let decrypted = decipher.update(encrypted)
  decrypted = Buffer.concat([decrypted, decipher.final()])
  return decrypted.toString()
}
```

### 11.2 Rate Limiting

```typescript
// middleware/rate-limit.ts
const rateLimit = {
  windowMs: 60 * 1000, // 1 menit
  max: 100 // 100 requests per menit
}

export function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip
  const now = Date.now()

  if (!rateLimitStore.has(ip)) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + rateLimit.windowMs })
    return next()
  }

  const record = rateLimitStore.get(ip)

  if (now > record.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + rateLimit.windowMs })
    return next()
  }

  if (record.count >= rateLimit.max) {
    return res.status(429).json({ error: 'Too many requests' })
  }

  record.count++
  rateLimitStore.set(ip, record)
  next()
}
```

### 11.3 Admin Protection

```typescript
// middleware/admin-auth.ts
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies.admin_token

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const payload = await jwtVerify(token, process.env.ADMIN_SECRET!)
    if (payload.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' })
    }
    req.admin = payload
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }
}
```

---

## 12. PWA Configuration

### 12.1 next-pwa Config

```typescript
// next.config.ts
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
})

module.exports = withPWA({
  // other next.js config
})
```

### 12.2 manifest.json

```json
{
  "name": "BubblePI Store",
  "short_name": "BubblePI",
  "description": "Jual beli akun premium",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0A0A0A",
  "theme_color": "#7C3AED",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

---

## 13. API Routes Summary

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | /api/products | - | List all products |
| GET | /api/products/:id | - | Product detail |
| POST | /api/checkout | Guest | Create order |
| GET | /api/order/:id | Owner/Admin | Order detail |
| POST | /api/auth/register | - | Register user |
| POST | /api/auth/login | - | Login user |
| GET | /api/user/orders | User | User order history |
| POST | /api/warranty/claim | User | Submit warranty claim |
| POST | /api/webhooks/xendit | Xendit | Payment callback |
| GET | /api/admin/orders | Admin | All orders |
| POST | /api/admin/warranty/:id/review | Admin | Approve/reject claim |
| GET | /api/admin/dashboard | Admin | Dashboard stats |
| POST | /api/admin/manual-order | Admin | Manual order input |
| GET | /api/admin/pricelist | Admin | Generate price list |

---

## 14. Database Schema (Prisma)

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String
  passwordHash  String
  role          Role      @default(USER)
  orders        Order[]
  warranties    Warranty[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Product {
  id            String    @id @default(cuid())
  supplierId    String
  name          String
  category      String?
  description   String?
  imageUrl      String?
  isActive      Boolean   @default(true)
  warrantyOptions WarrantyOption[]
  variants      Variant[]
  orders        Order[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Variant {
  id                String    @id @default(cuid())
  productId         String
  name              String
  price             Int       // IDR
  supplierVariantId String
  product           Product   @relation(fields: [productId], references: [id])
  stocks            AccountStock[]
  orders            Order[]
}

model WarrantyOption {
  id          String  @id @default(cuid())
  productId   String
  duration    Int     // 0, 7, 30
  price       Int     // IDR
  terms       String?
  product     Product @relation(fields: [productId], references: [id])
}

model AccountStock {
  id          String        @id @default(cuid())
  variantId   String
  credentials String        // encrypted
  status      StockStatus   @default(AVAILABLE)
  supplierId  String
  orderId     String?
  variant     Variant       @relation(fields: [variantId], references: [id])
  acquiredAt  DateTime      @default(now())
  soldAt      DateTime?
}

model Order {
  id              String        @id @default(cuid())
  orderId         String        @unique // BP-XXXXXXXX
  userId          String?
  guestEmail      String?
  guestName       String?
  productId       String
  variantId       String
  warrantyOptionId String?
  warrantyId      String?
  totalAmount     Int
  paymentMethod   PaymentMethod
  paymentStatus   PaymentStatus @default(PENDING)
  status          OrderStatus   @default(PENDING)
  xenditInvoiceId String?
  deliveredAt     DateTime?
  user            User?         @relation(fields: [userId], references: [id])
  product         Product       @relation(fields: [productId], references: [id])
  variant         Variant       @relation(fields: [variantId], references: [id])
  warranty        Warranty?     @relation(fields: [warrantyId], references: [id])
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
}

model Warranty {
  id              String        @id @default(cuid())
  orderId         String        @unique
  userId          String
  productId       String
  variantId       String
  warrantyOptionId String
  duration        Int
  startDate       DateTime?
  expiryDate      DateTime?
  status          WarrantyStatus @default(ACTIVE)
  claimCount      Int           @default(0)
  order           Order         @relation(fields: [orderId], references: [id])
  user            User          @relation(fields: [userId], references: [id])
  claims          WarrantyClaim[]
}

model WarrantyClaim {
  id              String        @id @default(cuid())
  warrantyId      String
  proofImageUrl   String
  status          ClaimStatus   @default(PENDING_REVIEW)
  rejectionReason String?
  submittedAt     DateTime      @default(now())
  reviewedAt      DateTime?
  warranty        Warranty      @relation(fields: [warrantyId], references: [id])
}

model Supplier {
  id          String    @id @default(cuid())
  name        String
  type        SupplierType // TELEGRAM_BOT, API
  config      Json      // bot token, api key, etc
  isActive    Boolean   @default(true)
  priority    Int       @default(0) // 0 = primary
}

enum Role {
  USER
  ADMIN
}

enum StockStatus {
  AVAILABLE
  HOLD
  SOLD
}

enum OrderStatus {
  PENDING
  AWAITING_PAYMENT
  PAID
  PROCESSING
  DELIVERED
  FAILED
  EXPIRED
}

enum PaymentMethod {
  QRIS
  VIRTUAL_ACCOUNT
}

enum PaymentStatus {
  PENDING
  PAID
  FAILED
  EXPIRED
}

enum WarrantyStatus {
  ACTIVE
  CLAIMED
  EXPIRED
}

enum ClaimStatus {
  PENDING_REVIEW
  APPROVED
  REJECTED
  EXPIRED
}

enum SupplierType {
  TELEGRAM_BOT
  API
}
```

---

## 15. Acceptance Criteria

### 15.1 Order Flow
- [ ] Guest bisa checkout tanpa login
- [ ] Payment via QRIS dan VA работает
- [ ] Setelah payment, auto-order ke supplier berjalan
- [ ] Akun dikirim via email setelah dapat dari supplier

### 15.2 Supplier Integration
- [ ] Adapter pattern berfungsi untuk multiple suppliers
- [ ] Auto-retry dengan exponential backoff
- [ ] Fallback ke supplier lain kalau satu offline
- [ ] Admin dapat notif kalau semua supplier gagal

### 15.3 Warranty
- [ ] Opsi warranty muncul di checkout dengan harga
- [ ] Warranty tracking di dashboard user
- [ ] Klaim dengan upload bukti berfungsi
- [ ] Admin bisa approve/reject klaim
- [ ] Auto-replacement kalau approve
- [ ] Proof image expiry 1×24 jam berjalan

### 15.4 Manual Order
- [ ] Admin bisa input order manual setelah deliver
- [ ] Warranty dibuat otomatis untuk order manual

### 15.5 Data Sync
- [ ] Price sync dari Google Sheets berfungsi
- [ ] Auto-update setiap 2 jam

### 15.6 Security
- [ ] Credentials terenkripsi AES-256
- [ ] Rate limiting berjalan
- [ ] Admin routes protected

### 15.7 PWA
- [ ] App bisa di-install di mobile
- [ ] Manifest correct

---

## 16. Future Considerations (Out of Scope)

| Feature | Notes |
|---------|-------|
| Testimonial System | Phase 3 |
| Customer Dashboard | Phase 3 |
| Dark/Light Mode | Phase 3 |
| Audit Log | Later |
| Social Login | Google, Telegram |
| Multiple Admin | User management |
| Refund via Xendit | Warranty reject dengan refund |
| Telegram Delivery | Kirim akun via Telegram |
| WhatsApp Notification | Alternate channel |