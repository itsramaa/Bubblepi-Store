-- Sync full schema (add missing columns and tables)

-- Add Role enum
DO $$ BEGIN CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Add StockStatus enum
DO $$ BEGIN CREATE TYPE "StockStatus" AS ENUM ('AVAILABLE', 'HOLD', 'SOLD'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Add OrderStatus enum
DO $$ BEGIN CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'AWAITING_PAYMENT', 'PAID', 'PROCESSING', 'DELIVERED', 'FAILED', 'EXPIRED'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Add PaymentMethod enum
DO $$ BEGIN CREATE TYPE "PaymentMethod" AS ENUM ('QRIS', 'VIRTUAL_ACCOUNT'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Add PaymentStatus enum
DO $$ BEGIN CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'EXPIRED'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Add WarrantyStatus enum
DO $$ BEGIN CREATE TYPE "WarrantyStatus" AS ENUM ('ACTIVE', 'CLAIMED', 'EXPIRED'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Add ClaimStatus enum
DO $$ BEGIN CREATE TYPE "ClaimStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Add SupplierType enum
DO $$ BEGIN CREATE TYPE "SupplierType" AS ENUM ('TELEGRAM_BOT', 'API'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Add columns to Product
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "supplierId" TEXT;
ALTER TABLE "Product" ALTER COLUMN "description" DROP NOT NULL;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "image" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "category" TEXT;

-- Add columns to Variant
ALTER TABLE "Variant" ADD COLUMN IF NOT EXISTS "supplierVariantId" TEXT;
ALTER TABLE "Variant" ADD COLUMN IF NOT EXISTS "duration" TEXT;
ALTER TABLE "Variant" ADD COLUMN IF NOT EXISTS "hasWarranty" BOOLEAN DEFAULT false;
ALTER TABLE "Variant" ADD COLUMN IF NOT EXISTS "warrantyDays" INTEGER;

-- Add AccountStock columns
ALTER TABLE "AccountStock" ADD COLUMN IF NOT EXISTS "supplierId" TEXT;

-- Add Order columns
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "guestName" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "guestEmail" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "warrantyId" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "warrantyExpiry" TIMESTAMP(3);

-- Add Supplier table
CREATE TABLE IF NOT EXISTS "Supplier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" "SupplierType" NOT NULL,
    "config" JSONB,
    "isActive" BOOLEAN DEFAULT true,
    "priority" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3)
);

-- Add Warranty table
CREATE TABLE IF NOT EXISTS "Warranty" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "status" "WarrantyStatus" DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

-- Add WarrantyClaim table
CREATE TABLE IF NOT EXISTS "WarrantyClaim" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "warrantyId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "proofImage" TEXT,
    "proofImageExpiry" TIMESTAMP(3),
    "status" "ClaimStatus" DEFAULT 'PENDING_REVIEW',
    "adminNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

-- Add Testimonial table
CREATE TABLE IF NOT EXISTS "Testimonial" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "productId" TEXT,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "image" TEXT,
    "isVisible" BOOLEAN DEFAULT false,
    "isPinned" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

-- Add missing Review columns
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "productId" TEXT;
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "variantId" TEXT;