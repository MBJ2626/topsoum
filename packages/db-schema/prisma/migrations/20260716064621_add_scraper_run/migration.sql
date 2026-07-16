-- CreateTable
CREATE TABLE "scraper_runs" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    "products_collected" INTEGER NOT NULL DEFAULT 0,
    "success_count" INTEGER NOT NULL DEFAULT 0,
    "error_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scraper_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "scraper_runs_vendor_id_started_at_idx" ON "scraper_runs"("vendor_id", "started_at");

-- AddForeignKey
ALTER TABLE "scraper_runs" ADD CONSTRAINT "scraper_runs_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
