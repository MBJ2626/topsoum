-- CreateEnum
CREATE TYPE "PendingMatchStatus" AS ENUM ('pending', 'approved', 'rejected', 'merged');

-- CreateTable
CREATE TABLE "pending_matches" (
    "id" TEXT NOT NULL,
    "vendor_slug" TEXT NOT NULL,
    "external_id" TEXT,
    "reference" TEXT,
    "offer_product_name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "created_product_id" TEXT NOT NULL,
    "candidate_product_id" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "strategy" TEXT NOT NULL,
    "status" "PendingMatchStatus" NOT NULL DEFAULT 'pending',
    "resolved_product_id" TEXT,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pending_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manual_overrides" (
    "id" TEXT NOT NULL,
    "vendor_slug" TEXT NOT NULL,
    "external_id" TEXT,
    "reference" TEXT,
    "product_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "manual_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pending_matches_status_idx" ON "pending_matches"("status");

-- AddForeignKey
ALTER TABLE "pending_matches" ADD CONSTRAINT "pending_matches_created_product_id_fkey" FOREIGN KEY ("created_product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pending_matches" ADD CONSTRAINT "pending_matches_candidate_product_id_fkey" FOREIGN KEY ("candidate_product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manual_overrides" ADD CONSTRAINT "manual_overrides_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
