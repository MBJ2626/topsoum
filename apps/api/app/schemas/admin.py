from __future__ import annotations

from typing import Literal

from pydantic import BaseModel

ScraperRunStatus = Literal["success", "partial", "failed", "running"]


class ScraperVendorStatus(BaseModel):
    vendor_name: str
    last_run_started_at: str | None
    last_run_finished_at: str | None
    last_run_status: ScraperRunStatus | None
    products_collected: int | None
    success_count: int | None
    error_count: int | None
    failure_rate: float | None


class ScrapersStatusResponse(BaseModel):
    vendors: list[ScraperVendorStatus]


class AdminStatsResponse(BaseModel):
    total_products: int
    total_offers: int
    last_updated_at: str | None
