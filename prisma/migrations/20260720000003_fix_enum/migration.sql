-- Fix enum compatibility
-- Rename old enum values to new ones

-- First, update any existing data that uses old values
UPDATE "Order" SET status = 'DELIVERED' WHERE status = 'FULFILLED';
UPDATE "Order" SET status = 'PENDING' WHERE status = 'PENDING_STOCK';

-- Create new enum type with all values
DO $$ 
BEGIN
    -- Add the new values first
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'PENDING' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'OrderStatus')) THEN
        ALTER TYPE "OrderStatus" ADD VALUE 'PENDING';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'AWAITING_PAYMENT' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'OrderStatus')) THEN
        ALTER TYPE "OrderStatus" ADD VALUE 'AWAITING_PAYMENT';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'PAID' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'OrderStatus')) THEN
        ALTER TYPE "OrderStatus" ADD VALUE 'PAID';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'PROCESSING' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'OrderStatus')) THEN
        ALTER TYPE "OrderStatus" ADD VALUE 'PROCESSING';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'DELIVERED' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'OrderStatus')) THEN
        ALTER TYPE "OrderStatus" ADD VALUE 'DELIVERED';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'FAILED' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'OrderStatus')) THEN
        ALTER TYPE "OrderStatus" ADD VALUE 'FAILED';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'EXPIRED' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'OrderStatus')) THEN
        ALTER TYPE "OrderStatus" ADD VALUE 'EXPIRED';
    END IF;
END $$;