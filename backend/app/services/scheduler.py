from __future__ import annotations

import asyncio
import calendar
import logging
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy.orm import Session

from app.database.db import SessionLocal
from app.models.campaign import Campaign
from app.models.delivery import Delivery
from app.services.campaign_delivery import (
    MAX_RETRIES,
    deliver_campaign,
    retry_delivery_once_async,
)

logger = logging.getLogger("smartnotify.scheduler")
POLL_SECONDS = 10


def _next_month(value: datetime) -> datetime:
    year = value.year + (1 if value.month == 12 else 0)
    month = 1 if value.month == 12 else value.month + 1
    day = min(value.day, calendar.monthrange(year, month)[1])
    return value.replace(year=year, month=month, day=day)


def next_occurrence(value: datetime, frequency: str) -> Optional[datetime]:
    frequency = (frequency or "one_time").lower()
    if frequency == "daily":
        return value + timedelta(days=1)
    if frequency == "weekly":
        return value + timedelta(weeks=1)
    if frequency == "monthly":
        return _next_month(value)
    return None


async def process_due_campaigns(
    db: Session,
    now: Optional[datetime] = None,
) -> list[dict]:
    now = now or datetime.now()

    campaigns = (
        db.query(Campaign)
        .filter(
            Campaign.status == "Scheduled",
            Campaign.next_run_at.isnot(None),
            Campaign.next_run_at <= now,
        )
        .order_by(Campaign.next_run_at.asc())
        .all()
    )

    results = []

    for campaign in campaigns:
        try:
            # Claim this campaign before performing external API calls.
            campaign.status = "Sending"
            db.commit()
            db.refresh(campaign)

            result = await deliver_campaign(db, campaign)

            frequency = (campaign.schedule_frequency or "one_time").lower()
            if frequency != "one_time":
                current_run = campaign.next_run_at or now
                campaign.next_run_at = next_occurrence(current_run, frequency)
                campaign.schedule_time = campaign.next_run_at
                campaign.status = "Scheduled"
            else:
                campaign.next_run_at = None

            db.commit()
            results.append(result)

        except Exception as error:
            db.rollback()
            logger.exception("Scheduled campaign %s failed", campaign.id)
            campaign.status = "Failed"
            db.commit()
            results.append({
                "success": False,
                "campaign_id": campaign.id,
                "error": str(error),
            })

    return results


async def process_due_retries(
    db: Session,
    now: Optional[datetime] = None,
) -> list[dict]:
    now = now or datetime.now()

    deliveries = (
        db.query(Delivery)
        .filter(
            Delivery.status == "Failed",
            Delivery.retry_count < MAX_RETRIES,
            Delivery.next_retry_at.isnot(None),
            Delivery.next_retry_at <= now,
        )
        .order_by(Delivery.next_retry_at.asc())
        .all()
    )

    results = []
    for delivery in deliveries:
        success = await retry_delivery_once_async(db, delivery)
        results.append({
            "delivery_id": delivery.id,
            "success": success,
            "retry_count": delivery.retry_count,
            "status": delivery.status,
        })
    return results


async def scheduler_tick() -> dict:
    
    """Run one complete scheduler cycle in the FastAPI event loop."""
    db: Session = SessionLocal()
    try:
        campaigns = await process_due_campaigns(db)
        retries = await process_due_retries(db)
        return {
            "campaigns_processed": len(campaigns),
            "retries_processed": len(retries),
            "campaigns": campaigns,
            "retries": retries,
        }
    finally:
        db.close()


async def scheduler_loop(stop_event: asyncio.Event) -> None:
    logger.info(
        "SmartNotify scheduler started; polling every %ss",
        POLL_SECONDS,
    )

    while not stop_event.is_set():
        try:
            result = await scheduler_tick()

            logger.info(
    "SCHEDULER RESULT: campaigns=%s retries=%s",
    result["campaigns_processed"],
    result["retries_processed"],
)
        except Exception:
            logger.exception("Scheduler tick failed")

        try:
            await asyncio.wait_for(
                stop_event.wait(),
                timeout=POLL_SECONDS,
            )
        except asyncio.TimeoutError:
            pass

    logger.info("SmartNotify scheduler stopped")
