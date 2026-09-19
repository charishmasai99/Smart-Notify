from __future__ import annotations

import base64
from datetime import datetime
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse, Response
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.models.delivery import Delivery


router = APIRouter(
    prefix="/tracking",
    tags=["Email Tracking"],
)


# ============================================================
# 1x1 TRANSPARENT GIF
# ============================================================

_PIXEL = base64.b64decode(
    "R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="
)


# ============================================================
# OPEN TRACKING
# ============================================================

@router.get(
    "/open/{tracking_token}",
    include_in_schema=True,
)
def track_email_open(
    tracking_token: str,
    db: Session = Depends(get_db),
):
    delivery = (
        db.query(Delivery)
        .filter(
            Delivery.tracking_token == tracking_token
        )
        .first()
    )

    if delivery:

        now = datetime.utcnow()

        # Record first open only.
        if delivery.opened_at is None:
            delivery.opened_at = now

        # Email open means Read.
        if (
            delivery.channel
            and delivery.channel.lower() == "email"
            and delivery.status in {
                "Queued",
                "Sending",
                "Sent",
                "Delivered",
                "Retrying",
            }
        ):
            delivery.status = "Read"

        db.commit()

    return Response(
        content=_PIXEL,
        media_type="image/gif",
        headers={
            "Cache-Control": (
                "no-store, "
                "no-cache, "
                "must-revalidate, "
                "max-age=0"
            ),
            "Pragma": "no-cache",
        },
    )


# ============================================================
# CLICK TRACKING
# ============================================================

@router.get(
    "/click/{tracking_token}",
    include_in_schema=True,
)
def track_email_click(
    tracking_token: str,
    url: str = Query(
        ...,
        min_length=1,
    ),
    db: Session = Depends(get_db),
):
    # --------------------------------------------------------
    # Validate destination URL
    # --------------------------------------------------------

    parsed = urlparse(url)

    if (
        parsed.scheme not in {
            "http",
            "https",
        }
        or not parsed.netloc
    ):
        raise HTTPException(
            status_code=400,
            detail="Invalid tracking URL.",
        )

    # --------------------------------------------------------
    # Find delivery
    # --------------------------------------------------------

    delivery = (
        db.query(Delivery)
        .filter(
            Delivery.tracking_token == tracking_token
        )
        .first()
    )

    if delivery:

        now = datetime.utcnow()

        # A click is also an engagement/open event.
        if delivery.opened_at is None:
            delivery.opened_at = now

        # Record first click timestamp.
        if delivery.clicked_at is None:
            delivery.clicked_at = now

        # Increment every click.
        delivery.click_count = (
            delivery.click_count or 0
        ) + 1

        # For email, clicking means the recipient
        # has interacted with the message.
        if (
            delivery.channel
            and delivery.channel.lower() == "email"
            and delivery.status in {
                "Queued",
                "Sending",
                "Sent",
                "Delivered",
                "Retrying",
            }
        ):
            delivery.status = "Read"

        db.commit()

    # --------------------------------------------------------
    # Redirect recipient to original URL
    # --------------------------------------------------------

    return RedirectResponse(
        url=url,
        status_code=307,
    )