from __future__ import annotations

from pydantic import BaseModel


class OfferClickResponse(BaseModel):
    redirect_url: str
    vendor_name: str
