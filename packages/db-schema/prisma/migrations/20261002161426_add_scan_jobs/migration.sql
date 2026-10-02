-- CreateTable
CREATE TABLE "scan_jobs" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "trigger" TEXT NOT NULL,
    "vendors" TEXT[],
    "scheduled_for" TIMESTAMP(3),
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),
    "results" JSONB,
    "error" TEXT,

    CONSTRAINT "scan_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scan_schedules" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "times" TEXT[],
    "configured_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "worker_seen_at" TIMESTAMP(3),

    CONSTRAINT "scan_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "scan_jobs_scheduled_for_key" ON "scan_jobs"("scheduled_for");

-- CreateIndex
CREATE INDEX "scan_jobs_status_requested_at_idx" ON "scan_jobs"("status", "requested_at");
