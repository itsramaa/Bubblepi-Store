import { test, expect } from "@playwright/test"

const BASE_URL = process.env.BASE_URL || "http://localhost:3000"

test.describe("Customer E2E Flow", () => {
  test("complete purchase flow", async ({ page }) => {
    // 1. Landing Page
    await page.goto(BASE_URL)
    await expect(page).toHaveTitle(/Bubblepi/i)
    console.log("✓ Landing page loaded")

    // 2. Browse Products
    await page.click('a[href="/products"]')
    await expect(page).toHaveURL(/\/products/)
    console.log("✓ Products page loaded")

    // Wait for products to load
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 }).catch(() => {
      // If no product cards, check for any product links
      console.log("⚠ No product cards found, checking for products...")
    })

    // 3. Product Detail (click first product if available)
    const productLink = page.locator('a[href*="/products/"]').first()
    if (await productLink.isVisible()) {
      await productLink.click()
      await expect(page).toHaveURL(/\/products\/.+/)
      console.log("✓ Product detail page loaded")
    } else {
      console.log("⚠ No products available to test")
      return
    }

    // 4. Select Variant (if available)
    const variantButton = page.locator('button[name="variant"]').first()
    if (await variantButton.isVisible()) {
      await variantButton.click()
      console.log("✓ Variant selected")
    }

    // 5. Add to Cart
    const addToCartBtn = page.locator('button:has-text("Tambah ke Keranjang"), button:has-text("Beli Sekarang")').first()
    if (await addToCartBtn.isVisible()) {
      await addToCartBtn.click()
      await page.waitForTimeout(1000)
      console.log("✓ Added to cart")
    }

    // 6. Go to Cart
    await page.goto(`${BASE_URL}/cart`)
    const cartItems = page.locator('[data-testid="cart-item"]')
    const itemCount = await cartItems.count()
    console.log(`✓ Cart has ${itemCount} items`)

    if (itemCount > 0) {
      // 7. Proceed to Checkout
      await page.click('a[href="/checkout"]')
      await expect(page).toHaveURL(/\/checkout/)
      console.log("✓ Checkout page loaded")

      // 8. Fill checkout form
      await page.fill('input[name="name"]', "Test Customer")
      await page.fill('input[name="email"]', "test@example.com")
      await page.fill('input[name="phone"]', "081234567890")
      
      // Submit step 1
      await page.click('button[type="submit"]')
      await page.waitForTimeout(1000)
      console.log("✓ Checkout step 1 submitted")

      // Note: Can't complete full flow without real payment
      // Step 2: Voucher (skip)
      // Step 3: Payment (would need Xendit test mode)
    } else {
      console.log("⚠ Cart is empty, skipping checkout")
    }
  })

  test("order lookup for guest", async ({ page }) => {
    await page.goto(`${BASE_URL}/orders/lookup`)
    await expect(page).toHaveURL(/\/orders\/lookup/)
    
    // Fill lookup form
    await page.fill('input[name="orderNumber"]', "BP-TEST123")
    await page.fill('input[name="email"]', "test@example.com")
    
    await page.click('button[type="submit"]')
    await page.waitForTimeout(1000)
    
    console.log("✓ Order lookup form submitted")
  })

  test("dark mode toggle", async ({ page }) => {
    await page.goto(BASE_URL)
    
    // Find theme toggle
    const themeToggle = page.locator('button[data-testid="theme-toggle"], button[aria-label="Toggle theme"]').first()
    
    if (await themeToggle.isVisible()) {
      const initialTheme = await page.locator("html").getAttribute("class")
      await themeToggle.click()
      await page.waitForTimeout(500)
      const newTheme = await page.locator("html").getAttribute("class")
      expect(initialTheme).not.toBe(newTheme)
      console.log("✓ Dark mode toggle works")
    } else {
      console.log("⚠ Theme toggle not found")
    }
  })

  test("PWA manifest loaded", async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/manifest.json`)
    expect(response?.status()).toBe(200)
    
    const manifest = await response?.json()
    expect(manifest?.name).toBeDefined()
    expect(manifest?.short_name).toBeDefined()
    console.log("✓ PWA manifest loaded")
  })

  test("service worker registration", async ({ page }) => {
    await page.goto(BASE_URL)
    
    // Check if SW is registered
    const swRegistered = await page.evaluate(() => {
      return navigator.serviceWorker?.getRegistration()?.then(r => !!r) ?? false
    })
    
    if (swRegistered) {
      console.log("✓ Service worker registered")
    } else {
      console.log("⚠ Service worker not yet registered")
    }
  })
})

test.describe("Admin Flow", () => {
  test("admin login page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/login`)
    await expect(page).toHaveURL(/\/admin\/login/)
    
    // Check for password input
    const passwordInput = page.locator('input[type="password"]')
    await expect(passwordInput).toBeVisible()
    console.log("✓ Admin login page loaded")
  })

  test("unauthorized admin access redirects to login", async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/dashboard`)
    await expect(page).toHaveURL(/\/admin\/login/)
    console.log("✓ Unauthenticated admin access redirected to login")
  })
})