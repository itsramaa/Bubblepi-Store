# BubblePI Store — UI/UX Specification

> **Version:** 1.0  
> **Created:** 2026-07-20  
> **Status:** Draft

---

## 1. Design System

### 1.1 Color Palette

#### Light Mode
| Token | Hex | Usage |
|-------|-----|-------|
| `--primary` | `#7C3AED` | Buttons, links, accents |
| `--primary-hover` | `#6D28D9` | Button hover state |
| `--secondary` | `#F472B6` | Secondary actions, badges |
| `--background` | `#FAFAFA` | Page background |
| `--surface` | `#FFFFFF` | Cards, modals |
| `--text` | `#111827` | Primary text |
| `--text-muted` | `#6B7280` | Secondary text |
| `--border` | `#E5E7EB` | Borders, dividers |
| `--success` | `#10B981` | Success states |
| `--warning` | `#F59E0B` | Warning states |
| `--error` | `#EF4444` | Error states |

#### Dark Mode
| Token | Hex | Usage |
|-------|-----|-------|
| `--primary` | `#8B5CF6` | Buttons, links, accents |
| `--primary-hover` | `#A78BFA` | Button hover state |
| `--secondary` | `#F472B6` | Secondary actions |
| `--background` | `#0A0A0A` | Page background |
| `--surface` | `#171717` | Cards, modals |
| `--text` | `#F9FAFB` | Primary text |
| `--text-muted` | `#9CA3AF` | Secondary text |
| `--border` | `#262626` | Borders, dividers |
| `--success` | `#34D399` | Success states |
| `--warning` | `#FBBF24` | Warning states |
| `--error` | `#F87171` | Error states |

### 1.2 Typography

| Element | Font | Size | Weight | Line Height |
|---------|------|------|--------|-------------|
| H1 | Inter | 36px | 700 | 1.2 |
| H2 | Inter | 30px | 700 | 1.25 |
| H3 | Inter | 24px | 600 | 1.3 |
| H4 | Inter | 20px | 600 | 1.4 |
| Body | Inter | 16px | 400 | 1.5 |
| Body Small | Inter | 14px | 400 | 1.5 |
| Caption | Inter | 12px | 400 | 1.4 |
| Button | Inter | 14px | 600 | 1 |
| Code | JetBrains Mono | 14px | 400 | 1.5 |

### 1.3 Spacing System

| Token | Value |
|-------|-------|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-5` | 20px |
| `--space-6` | 24px |
| `--space-8` | 32px |
| `--space-10` | 40px |
| `--space-12` | 48px |
| `--space-16` | 64px |

### 1.4 Border Radius

| Token | Value |
|-------|-------|
| `--radius-sm` | 6px |
| `--radius-md` | 8px |
| `--radius-lg` | 12px |
| `--radius-xl` | 16px |
| `--radius-2xl` | 24px |
| `--radius-full` | 9999px |

### 1.5 Shadows

| Token | Value |
|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` |
| `--shadow-md` | `0 4px 6px -1px rgba(0,0,0,0.1)` |
| `--shadow-lg` | `0 10px 15px -3px rgba(0,0,0,0.1)` |
| `--shadow-xl` | `0 20px 25px -5px rgba(0,0,0,0.1)` |

---

## 2. Responsive Breakpoints

| Breakpoint | Width | Target |
|------------|-------|--------|
| Mobile | < 640px | Phone |
| Tablet | 640px - 1024px | Tablet |
| Desktop | > 1024px | Desktop |

**Mobile-first approach** — design untuk mobile dulu, scale up untuk tablet/desktop.

---

## 3. Page Structure

### 3.1 Public Pages

| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Landing page, featured products |
| Products | `/products` | All products grid |
| Product Detail | `/products/[id]` | Product info, variant selection, buy |
| Cart | `/cart` | Cart items, checkout button |
| Checkout | `/checkout` | Payment method, delivery form |
| Order Success | `/order/[id]` | Order confirmation, status |
| Order Tracking | `/track/[orderId]` | Track order status (guest) |

### 3.2 User Pages (Login Required)

| Page | Route | Description |
|------|-------|-------------|
| Login | `/login` | User login |
| Register | `/register` | User register |
| Dashboard | `/dashboard` | Order history, warranty status |
| Order Detail | `/dashboard/orders/[id]` | Order detail + warranty claim |

### 3.3 Admin Pages

| Page | Route | Description |
|------|-------|-------------|
| Admin Login | `/admin/login` | Admin authentication |
| Dashboard | `/admin` | Stats, overview |
| Orders | `/admin/orders` | All orders, filter, search |
| Order Detail | `/admin/orders/[id]` | Order detail, manual fulfill |
| Warranty Claims | `/admin/warranty` | Pending claims |
| Warranty Review | `/admin/warranty/[id]` | Review claim, approve/reject |
| Products | `/admin/products` | Product list, toggle display |
| Suppliers | `/admin/suppliers` | Supplier management |
| Settings | `/admin/settings` | Site settings |
| Manual Order | `/admin/orders/new` | Input manual order |
| Price List | `/admin/pricelist` | Generate price list |

---

## 4. Component Specifications

### 4.1 Header (Navigation)

```
┌─────────────────────────────────────────────────┐
│ [Logo] BubblePI              [🌙] [🛒] [Login]  │
└─────────────────────────────────────────────────┘
```

**Elements:**
- Logo (left)
- Theme toggle (sun/moon icon)
- Cart icon with badge (item count)
- User menu (login/user dropdown)

**Mobile:**
- Hamburger menu
- Slide-in navigation

### 4.2 Product Card

```
┌─────────────────────┐
│   [Product Image]   │
│                     │
├─────────────────────┤
│ Netflix             │
│ 1 Bulan • 3 Bulan  │
│                     │
│ Rp 25.000          │
│ [Beli Sekarang]    │
└─────────────────────┘
```

**States:**
- Default: Normal display
- Hover: Slight lift (shadow), scale 1.02
- Loading: Skeleton
- Out of stock: Grayed out, "Stok Habis" badge

### 4.3 Product Detail Page

```
┌──────────────────────────────────────────────────────┐
│ [← Kembali]                                          │
│                                                      │
│  ┌──────────┐  ┌──────────────────────────────────┐ │
│  │          │  │ Netflix Premium                  │ │
│  │  [Image] │  │ Akun共享 premium berkualitas     │ │
│  │          │  │                                  │ │
│  └──────────┘  │ Kategori: Streaming              │ │
│                │                                  │ │
│                │ [Pilih Variant:]                  │ │
│                │ ○ 1 Bulan    Rp 25.000           │ │
│                │ ● 3 Bulan    Rp 65.000           │ │
│                │ ○ 1 Tahun   Rp 200.000           │ │
│                │                                  │ │
│                │ [Pilih Garansi:]                  │ │
│                │ ○ Tanpa    Rp 0                  │ │
│                │ ● 7 Hari  Rp 5.000   S&K         │ │
│                │ ○ 30 Hari Rp 15.000  S&K         │ │
│                │                                  │ │
│                │ Total: Rp 30.000                 │ │
│                │ [🛒 Tambah ke Keranjang]         │ │
│                │ [⚡ Beli Sekarang]               │ │
│                └──────────────────────────────────┘ │
└───────────────────────────────────────��──────────────┘
```

### 4.4 Cart Drawer (Sheet)

```
┌─────────────────────────┐
│ Keranjang         [X]   │
├─────────────────────────┤
│ ┌─────────────────────┐ │
│ │ Netflix 1 Bulan     │ │
│ │ Garansi 7 Hari      │ │
│ │ Rp 30.000    [🗑️]  │ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │ Spotify 3 Bulan     │ │
│ │ Tanpa Garansi       │ │
│ │ Rp 45.000    [🗑️]  │ │
│ └─────────────────────┘ │
│                         │
│ ─────────────────────── │
│ Total: Rp 75.000       │
│                         │
│ [Lanjut ke Checkout]   │
└─────────────────────────┘
```

### 4.5 Checkout Page

```
┌─────────────────────────────────────────────────────────┐
│ Checkout                                                 │
├────────────────────────┬────────────────────────────────┤
│ Ringkasan Pesanan      │ Pengiriman                     │
│ ───────────────────    │ ─────────────────────────────  │
│ Netflix 1 Bulan        │ [Nama Lengkap]                 │
│ Garansi 7 Hari         │ [Email] ← untuk kirim akun     │
│ Rp 30.000              │ [No. HP] (opsional)            │
│                        │                                │
│ Total: Rp 30.000       │ Metode Pembayaran:             │
│                        │ ┌────┐ ┌────┐                  │
│                        │ │QRIS│ │ VA │                  │
│                        │ └────┘ └────┘                  │
│                        │                                │
│                        │ [Bayar Rp 30.000]             │
└────────────────────────┴────────────────────────────────┘
```

### 4.6 Order Status Page

```
┌─────────────────────────────────────────────────┐
│ Order #BP-ABCD1234                              │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ ○ PENDING → ● PAID → ○ PROCESSING → ○   │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│ Status: PESANAN DIPROSES                        │
│ Mohon tunggu, akun sedang diproses...          │
│                                                 │
│ ────────────────────────────                   │
│                                                 │
│ Detail:                                        │
│ • Produk: Netflix Premium 1 Bulan             │
│ • Garansi: 7 Hari                              │
│ • Total: Rp 30.000                            │
│ • Payment: QRIS                               │
│                                                 │
│ ────────────────────────────                   │
│                                                 │
│ [Cek Ulang] [Hubungi Admin]                    │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 4.7 Warranty Claim Modal

```
┌─────────────────────────────────────────────┐
│ Klaim Garansi                        [X]    │
├─────────────────────────────────────────────┤
│                                             │
│ Order: #BP-ABCD1234                         │
│ Produk: Netflix Premium 1 Bulan             │
│ Garansi aktif sampai: 25 Juli 2026          │
│                                             │
│ ─────────────────────────────────────────   │
│                                             │
│ Bukti Masalah:                              │
│ ┌─────────────────────────────────────┐    │
│ │                                     │    │
│ │     [📤 Upload Screenshot]          │    │
│ │     Max 5MB, JPG/PNG               │    │
│ │                                     │    │
│ └─────────────────────────────────────┘    │
│                                             │
│ ─────────────────────────────────────────   │
│                                             │
│ S&K Garansi:                                │
│ • Klaim max 1x per produk                  │
│ • Bukti error wajib dalam 1×24 jam         │
│ • Akun tidak bisa digunakan                │
│                                             │
│                                             │
│ [Batal]              [Kirim Klaim]          │
│                                             │
└─────────────────────────────────────────────┘
```

### 4.8 User Dashboard

```
┌─────────────────────────────────────────────────┐
│ Halo, Rama!                    [Logout]        │
├─────────────────────────────────────────────────┤
│                                                 │
│ [Pesanan Saya] [Garansi Aktif]                 │
│                                                 │
│ ───────────────────────────────────────────   │
│                                                 │
│ #BP-ABCD1234 - Netflix - 1 Bulan              │
│ Status: ✅ Selesai                             │
│ Garansi: Aktif (exp: 25 Jul 2026)  [Klaim]   │
│                                                 │
│ ─────────────────────────────────────────���─   │
│                                                 │
│ #BP-EFGH5678 - Spotify - 3 Bulan              │
│ Status: ✅ Selesai                             │
│ Garansi: Expired                               │
│                                                 │
│ ───────────────────────────────────────────   │
│                                                 │
│ [Lihat Semua Pesanan]                          │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 4.9 Admin Dashboard

```
┌─────────────────────────────────────────────────────────┐
│ BubblePI Admin                    [Admin] [Logout]     │
├─────────────┬───────────────────────────────────────────┤
│             │                                            │
│ 📊 Dashboard│  Ringkasan Hari Ini                       │
│             │  ─────────────────                         │
│ 📦 Orders   │  ┌────────┐ ┌────────┐ ┌────────┐       │
│             │  │ Rp 500K │ │  12    │ │   3    │       │
│ 🛡️ Garansi  │  │Revenue │ │Orders  │ │Claims  │       │
│             │  └────────┘ └────────┘ └────────┘       │
│ 📦 Products │                                            │
│             │  Pesanan Terbaru                          │
│ 🤖 Suppliers│  ─────────────────                         │
│             │  #BP-ABCD1234 | Netflix | Paid  | Processing │
│ ⚙️ Settings │  #BP-EFGH5678 | Spotify | Paid  | Delivered  │
│             │                                            │
│ 📊 Reports  │  ⚠️ Stok Menipis                           │
│             │  ─────────────────                         │
│             │  • Netflix 1 Bulan: 2 tersisa             │
│             │  • Spotify 3 Bulan: 0 tersisa             │
│             │                                            │
└─────────────┴───────────────────────────────────────────┘
```

### 4.10 Admin Order Detail

```
┌─────────────────────────────────────────────────────────┐
│ Order #BP-ABCD1234                    [← Kembali]      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Info Pesanan                Status: PROCESSING         │
│ ───────────────────        ─────────────────────────   │
│ Customer: rama@email.com   Payment: ✅ Paid            │
│ Product: Netflix 1 Bulan   Method: QRIS                │
│ Variant: 1 Bulan           Amount: Rp 25.000          │
│ Warranty: 7 Hari (Rp 5K)   Date: 20 Jul 2026 14:30    │
│ Total: Rp 30.000                                        │
│                                                         │
│ ─────────────────────────────────────────────────────   │
│                                                         │
│ Timeline:                                              │
│ ───────────────────                                    │
│ 14:30 - Pesanan dibuat                                │
│ 14:31 - Pembayaran berhasil                           │
│ 14:32 - Meminta akun ke supplier...                   │
│                                                         │
│ ─────────────────────────────────────────────────────   │
│                                                         │
│ Actions:                                               │
│ [ Kirim Manual ] [ Batalkan ]                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 4.11 Admin Warranty Review

```
┌─────────────────────────────────────────────────────────┐
│ Klaim Garansi #WC-ABCD1234           [← Kembali]       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Info Klaim                   Status: PENDING REVIEW    │
│ ───────────────────        ─────────────────────────   │
│ Order: #BP-ABCD1234        Submit: 20 Jul 2026 15:00   │
│ Customer: rama@email.com   Product: Netflix 1 Bulan    │
│ Warranty: 7 Hari           Durasi: Aktif (exp 27 Jul)  │
│                                                         │
│ ─────────────────────────────────────────────────────   │
│                                                         │
│ Bukti Masalah:                                         │
│ ┌───────────────────────────────────────────────────┐  │
│ │                                                   │  │
│ │         [Screenshot Error Screenshot]            │  │
│ │                                                   │  │
│ │                                                   │  │
│ └───────────────────────────────────────────────────┘  │
│                                                         │
│ ─────────────────────────────────────────────────────   │
│                                                         │
│ Actions:                                               │
│ [Tolak]                    [Setuju - Kirim Pengganti]  │
│                                                     │  │
│ Alasan Penolakan: [________________] (jika tolak)    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 4.12 Price List Generator (Admin)

```
┌─────────────────────────────────────────────────────────┐
│ Generate Price List                     [← Kembali]    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Opsi Tampilan:                                          │
│ ───────────────────                                    │
│ ○ Semua Produk                                         │
│ ○ Produk Terpilih (pilih di bawah)                     │
│                                                         │
│ Opsi Harga:                                             │
│ ───────────────────                                    │
│ ○ Harga Pasaran (dari Sheets)                          │
│ ○ Harga Promo (custom)                                 │
│                                                         │
│ Preview:                                                │
│ ┌───────────────────────────────────────────────────┐  │
│ │ BUBBLEPI STORE - DAFTAR HARGA                     │  │
│ │ ───────────────────────────────────────           │  │
│ │ Netflix Premium                                  │  │
│ │   1 Bulan   | Rp 25.000                          │  │
│ │   3 Bulan   | Rp 65.000                          │  │
│ │   1 Tahun   | Rp 200.000                         │  │
│ │                                                   │  │
│ │ Spotify Premium                                  │  │
│ │   1 Bulan   | Rp 15.000                          │  │
│ │   3 Bulan   | Rp 35.000                          │  │
│ └───────────────────────────────────────────────────┘  │
│                                                         │
│ Export:                                                 │
│ [📄 PDF] [🖼️ Image] [🔗 Copy Link]                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 5. User Flows (UI Perspective)

### 5.1 Guest Purchase Flow

```
[Home] → [Products] → [Product Detail]
                              ↓
                         [Beli Sekarang]
                              ↓
                         [Checkout Form]
                    (isi email, nama)
                              ↓
                       [Pilih Payment]
                              ↓
                    [Bayar via Xendit]
                              ↓
                    [Order Success Page]
                         ↙          ↘
                [Email Notif]   [Check Status]
                                        ↓
                              [Order #BP-XXXX]
                                   /         \
                            [Processing]   [Delivered]
                                    ↓            ↓
                              [Get Account]  [View Account]
                                    ↓            ↓
                              [Dashboard]   [Claim Garansi]
```

### 5.2 User Login Flow

```
[Landing] → [Login/Register]
                 ↓
           [Dashboard]
    ┌────────────┼────────────┐
    ↓            ↓            ↓
[Orders]    [Warranty]    [Profile]
```

### 5.3 Warranty Claim Flow

```
[Dashboard] → [Order Detail]
                    ↓
              [Klaim Garansi]
                    ↓
         [Upload Screenshot Modal]
                    ↓
           [Submit - Status: Pending]
                    ↓
              [Email: Received]
                    ↓
         [Admin Review]
          ↙         ↘
     [Approve]    [Reject]
        ↓           ↓
  [Auto-Order]  [Email: Rejected]
  [Deliver]
```

### 5.4 Manual Order Flow (Admin)

```
[Admin] → [Orders] → [Manual Order]
                        ↓
              [Input Form]
         (nama, email, produk,
          variant, garansi, harga)
                        ↓
                   [Submit]
                        ↓
              [Order Created]
                        ↓
              [Delivery Manual]
                        ↓
              [Update Status:
               Delivered]
                        ↓
              [Warranty Active]
```

---

## 6. Component States

### 6.1 Button

| State | Style |
|-------|-------|
| Default | bg-primary, text-white |
| Hover | bg-primary-hover, scale 1.02 |
| Active | scale 0.98 |
| Disabled | bg-gray-300, cursor-not-allowed |
| Loading | spinner icon, disabled |

### 6.2 Input

| State | Style |
|-------|-------|
| Default | border-gray-300 |
| Focus | border-primary, ring-2 ring-primary/20 |
| Error | border-error, ring-2 ring-error/20 |
| Disabled | bg-gray-100, cursor-not-allowed |

### 6.3 Card

| State | Style |
|-------|-------|
| Default | bg-surface, shadow-sm |
| Hover | shadow-md, scale 1.01 |
| Selected | border-primary, ring-2 ring-primary/20 |

### 6.4 Toast Notifications

| Type | Style |
|------|-------|
| Success | bg-success, text-white |
| Error | bg-error, text-white |
| Warning | bg-warning, text-black |
| Info | bg-primary, text-white |

---

## 7. Animations & Transitions

### 7.1 Page Transitions

- **Enter:** Fade in + slide up (200ms, ease-out)
- **Exit:** Fade out (150ms, ease-in)

### 7.2 Component Animations

| Component | Animation |
|-----------|-----------|
| Button click | Scale 0.98 (100ms) |
| Card hover | Translate Y -4px + shadow (200ms) |
| Modal open | Fade in + scale from 0.95 (200ms) |
| Modal close | Fade out + scale to 0.95 (150ms) |
| Drawer (cart) | Slide from right (250ms) |
| Toast | Slide up + fade in (200ms) |
| Skeleton | Pulse animation (1.5s infinite) |
| Loading spinner | Rotate 360deg (1s infinite) |

### 7.3 Micro-interactions

| Element | Interaction |
|---------|-------------|
| Heart/favorite | Scale bounce on click |
| Add to cart | Button pulse + cart badge bounce |
| Checkbox | Check mark draws in |
| Toggle | Smooth slide |
| Accordion | Height transition |

---

## 8. Accessibility (WCAG 2.1 AA)

### 8.1 Requirements

- [ ] All images have alt text
- [ ] Color contrast ratio ≥ 4.5:1
- [ ] Focus states visible
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Form labels associated
- [ ] Error messages announced

### 8.2 Focus Styles

```css
*:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}
```

---

## 9. Mobile UX Considerations

### 9.1 Touch Targets

- Minimum 44x44px for buttons
- Minimum 48x48px for interactive elements
- Adequate spacing between tap targets (8px)

### 9.2 Gestures

| Gesture | Action |
|---------|--------|
| Swipe left | Next image (product gallery) |
| Swipe right | Previous image |
| Pull to refresh | Refresh order status |
| Long press | Show context menu |

### 9.3 Mobile Navigation

```
┌────────────────────────────────────────┐
│ [☰]  BubblePI            [🛒] [👤]   │
├────────────────────────────────────────┤
│                                        │
│          [Content Area]               │
│                                        │
│                                        │
│                                        │
└────────────────────────────────────────┘
        ↓ (tap hamburger)
┌────────────────────────────────────────┐
│ [X]                              [👤] │
│ ─────────────────────────────────────  │
│ 🏠 Beranda                            │
│ 📦 Produk                             │
│ 📋 Pesanan Saya                       │
│ 🛡️ Garansi Saya                      │
│ ─────────────────────────────────────  │
│ 🌙 Mode Gelap                         │
│ ❓ Bantuan                            │
└────────────────────────────────────────┘
```

---

## 10. Error States

### 10.1 Empty States

```
┌─────────────────────────────────────────┐
│                                         │
│         [Shopping Bag Icon]            │
│                                         │
│       Keranjang Kosong                 │
│                                         │
│   Tambahkan produk untuk memulai       │
│       belanja                          │
│                                         │
│    [Mulai Belanja]                     │
│                                         │
└─────────────────────────────────────────┘
```

### 10.2 Error States

```
┌─────────────────────────────────────────┐
│                                         │
│          [Warning Icon]                │
│                                         │
│     Terjadi Kesalahan                  │
│                                         │
│   Maaf, terjadi kesalahan.             │
│   Silakan coba lagi nanti.             │
│                                         │
│    [Coba Lagi]  [Hubungi Admin]        │
│                                         │
└─────────────────────────────────────────┘
```

### 10.3 Loading States

```
┌─────────────────────────────────────────┐
│ ┌─────────────────────────────────────┐ │
│ │ ████████████░░░░░░░░░░░░░░░░░░░░░░░ │ │
│ │          45%                        │ │
│ └─────────────────────────────────────┘ │
│                                         │
│      Memuat data...                    │
│                                         │
└─────────────────────────────────────────┘
```

---

## 11. Admin-Specific UX

### 11.1 Bulk Actions

| Action | Trigger | Location |
|--------|---------|----------|
| Select all | Checkbox header | Table |
| Deselect all | Button | Table header |
| Bulk update status | Dropdown | Selection bar |
| Bulk delete | Button (danger) | Selection bar |

### 11.2 Filters

```
┌─────────────────────────────────────────────────────────┐
│ Filters:                                                │
│ ─────────────────────────────────────────────────────  │
│ [Status ▼] [Payment ▼] [Date Range] [Search...] [🔍] │
└─────────────────────────────────────────────────────────┘
```

### 11.3 Data Tables

- Sortable columns (click header)
- Pagination (10/25/50 per page)
- Row hover highlight
- Action buttons per row
- Responsive: scroll horizontal on mobile

---

## 12. SEO Considerations

### 12.1 Meta Tags

| Page | Title | Description |
|------|-------|-------------|
| Home | BubblePI Store - Akun Premium Terpercaya | Jual akun Netflix, Spotify, Disney+ premium dengan garansi |
| Products | Produk - BubblePI Store | Daftar akun premium berkualitas |
| Product | [Produk] - BubblePI Store | Harga [produk], garansi tersedia |

### 12.2 Structured Data

- Product schema (price, availability)
- Organization schema
- BreadcrumbList schema

### 12.3 Performance

- Lighthouse score ≥ 90
- First Contentful Paint < 1.5s
- Time to Interactive < 3s
- Cumulative Layout Shift < 0.1

---

## 13. PWA Considerations

### 13.1 Install Prompt

- Show after 2nd visit
- Custom install button in footer
- iOS: Custom instructions (Add to Home Screen)

### 13.2 Offline Support

- Show offline page when no connection
- Cache product pages for browsing
- Queue actions (checkout) for when online

### 13.3 App Icons

| Size | Usage |
|------|-------|
| 72x72 | Chrome Web Store |
| 96x72 | Google Play Store |
| 128x128 | Chrome |
| 192x192 | Android |
| 512x512 | iOS, PWA |

---

## 14. Component Library (shadcn/ui)

### 14.1 Required Components

| Category | Components |
|----------|------------|
| Layout | Container, Sheet (drawer), Separator |
| Navigation | Tabs, Dropdown Menu, Breadcrumb |
| Forms | Input, Select, Checkbox, Radio, Button, Label |
| Data Display | Card, Badge, Table, Avatar |
| Feedback | Toast, Dialog (modal), Skeleton, Alert |
| Overlay | Popover, Tooltip |
| Misc | Toggle (dark mode), Accordion |

### 14.2 Custom Components to Build

| Component | Description |
|-----------|-------------|
| ProductCard | Card with image, title, price, CTA |
| OrderTimeline | Visual order status tracker |
| WarrantyStatus | Badge + expiry display |
| PriceDisplay | Price with strikethrough for promo |
| ImageGallery | Swipeable image gallery |
| FileUpload | Drag & drop image upload |

---

## 15. Acceptance Criteria (UI/UX)

### 15.1 Visual
- [ ] Color scheme matches spec (light/dark)
- [ ] Typography consistent
- [ ] Spacing follows system
- [ ] Responsive on all breakpoints
- [ ] Animations smooth (60fps)

### 15.2 Functionality
- [ ] All buttons clickable
- [ ] Forms validate correctly
- [ ] Cart persists (localStorage)
- [ ] Checkout flow complete
- [ ] Order status updates

### 15.3 Accessibility
- [ ] Keyboard navigable
- [ ] Focus states visible
- [ ] Screen reader works
- [ ] Color contrast passes

### 15.4 Performance
- [ ] Page loads < 3s
- [ ] No layout shift
- [ ] Images optimized
- [ ] PWA installable

---

## 16. Future Enhancements (Out of Scope)

| Feature | Notes |
|---------|-------|
| Live chat | Customer support |
| Push notifications | Web push |
| Social login | Google, Telegram |
| Dark mode toggle | In header |
| Wishlist | Save for later |
| Product comparison | Compare prices |
| Loyalty points | Rewards system |
| Affiliate program | Commission |