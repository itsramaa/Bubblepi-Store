-- CreateTable
CREATE TABLE "price_drop_notifications" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "target_price" INTEGER,
    "notified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_drop_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "price_drop_notifications_variant_id_notified_idx" ON "price_drop_notifications"("variant_id", "notified");

-- CreateIndex
CREATE UNIQUE INDEX "price_drop_notifications_email_variant_id_key" ON "price_drop_notifications"("email", "variant_id");

-- AddForeignKey
ALTER TABLE "price_drop_notifications" ADD CONSTRAINT "price_drop_notifications_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "Variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
