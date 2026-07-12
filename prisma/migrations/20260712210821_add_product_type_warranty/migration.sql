-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'sharing';

-- AlterTable
ALTER TABLE "Variant" ADD COLUMN     "hasWarranty" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "warrantyDays" INTEGER;
