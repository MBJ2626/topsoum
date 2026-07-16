from __future__ import annotations

import uuid

from sqlalchemy.orm import Session

from app.repositories.models import ManualOverride


def create(
    session: Session,
    *,
    vendor_slug: str,
    external_id: str | None,
    reference: str | None,
    product_id: str,
) -> ManualOverride:
    override = ManualOverride(
        id=str(uuid.uuid4()),
        vendor_slug=vendor_slug,
        external_id=external_id,
        reference=reference,
        product_id=product_id,
    )
    session.add(override)
    session.commit()
    session.refresh(override)
    return override
