from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

ScanJobStatus = Literal["queued", "running", "success", "partial", "failed"]


class VendorScanResultOut(BaseModel):
    vendor: str
    offers_collected: int | None
    scan_failures: int
    offers_loaded: int | None
    error: str | None


class ScanJobOut(BaseModel):
    id: str
    status: ScanJobStatus
    trigger: Literal["manual", "scheduled"]
    vendors: list[str]
    requested_at: str
    started_at: str | None
    finished_at: str | None
    results: list[VendorScanResultOut]
    error: str | None


class ScanListResponse(BaseModel):
    jobs: list[ScanJobOut]
    worker_online: bool
    worker_seen_at: str | None


class ScanCreateRequest(BaseModel):
    """Liste vide = tous les vendeurs."""

    vendors: list[str] = Field(default_factory=list, max_length=20)


class ScanScheduleOut(BaseModel):
    enabled: bool
    times: list[str]
    timezone: str
    next_run_at: str | None


class ScanScheduleUpdate(BaseModel):
    enabled: bool
    times: list[str] = Field(default_factory=list, max_length=20)
