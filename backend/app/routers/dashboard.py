from collections import Counter

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.db import get_db

from app.models.user import User
from app.models.audience import Audience
from app.models.campaign import Campaign
from app.models.template import Template
from app.models.delivery import Delivery

from app.utils.roles import require_workspace_user


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


# ============================================================
# ROLE-AWARE DASHBOARD OVERVIEW
# ============================================================
#
# This endpoint remains read-only. All three workspace roles can
# view the dashboard, while their frontend workspace determines
# which parts of this data are presented to them.
#
# No campaign, delivery, scheduler, notification or channel
# behavior is changed here.
#
# ============================================================

@router.get("/")
def dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_workspace_user),
):
    total_users = db.query(User).count()
    total_audience = db.query(Audience).count()
    total_campaigns = db.query(Campaign).count()
    total_templates = db.query(Template).count()

    # --------------------------------------------------------
    # Campaign workflow status
    # --------------------------------------------------------

    campaign_status = {
        "draft": db.query(Campaign).filter(
            Campaign.status == "Draft"
        ).count(),
        "pending_review": db.query(Campaign).filter(
            Campaign.status == "Pending Review"
        ).count(),
        "approved": db.query(Campaign).filter(
            Campaign.status == "Approved"
        ).count(),
        "scheduled": db.query(Campaign).filter(
            Campaign.status == "Scheduled"
        ).count(),
        "sending": db.query(Campaign).filter(
            Campaign.status == "Sending"
        ).count(),
        "completed": db.query(Campaign).filter(
            Campaign.status == "Completed"
        ).count(),
        "rejected": db.query(Campaign).filter(
            Campaign.status == "Rejected"
        ).count(),
    }

    # --------------------------------------------------------
    # Delivery status
    # --------------------------------------------------------

    delivery_status_rows = (
        db.query(Delivery.status)
        .all()
    )

    delivery_status = dict(
        Counter(
            (status or "Unknown").strip()
            for (status,) in delivery_status_rows
        )
    )

    # --------------------------------------------------------
    # Channel distribution
    # --------------------------------------------------------

    channel_rows = (
        db.query(Delivery.channel)
        .all()
    )

    delivery_channels = dict(
        Counter(
            (channel or "Unknown").strip()
            for (channel,) in channel_rows
        )
    )

    # --------------------------------------------------------
    # Engagement overview
    # --------------------------------------------------------

    total_deliveries = db.query(Delivery).count()
    sent_deliveries = db.query(Delivery).filter(
        Delivery.sent_at.isnot(None)
    ).count()
    delivered_deliveries = db.query(Delivery).filter(
        Delivery.delivered_at.isnot(None)
    ).count()
    failed_deliveries = db.query(Delivery).filter(
        Delivery.failed_at.isnot(None)
    ).count()
    opened_deliveries = db.query(Delivery).filter(
        Delivery.opened_at.isnot(None)
    ).count()
    clicked_deliveries = db.query(Delivery).filter(
        Delivery.clicked_at.isnot(None)
    ).count()

    engagement_rate = (
        (opened_deliveries / delivered_deliveries) * 100
        if delivered_deliveries
        else 0
    )

    delivery_success_rate = (
        (delivered_deliveries / sent_deliveries) * 100
        if sent_deliveries
        else 0
    )

    # --------------------------------------------------------
    # User role distribution — useful to Admin dashboard
    # --------------------------------------------------------

    user_role_rows = db.query(User.role).all()
    user_roles = dict(
        Counter(
            (role or "Unknown").strip()
            for (role,) in user_role_rows
        )
    )

    # --------------------------------------------------------
    # Channel distribution from campaign configuration.
    # This does not alter campaign data; it is read-only dashboard
    # aggregation for the campaign manager workspace.
    # --------------------------------------------------------

    campaign_channel_counter = Counter()

    for campaign in db.query(Campaign).all():
        channels = campaign.channels or []
        if isinstance(channels, list):
            for channel in channels:
                if channel:
                    campaign_channel_counter[str(channel)] += 1

    # --------------------------------------------------------
    # Upcoming scheduled campaigns
    # --------------------------------------------------------

    scheduled_campaigns = (
        db.query(Campaign)
        .filter(Campaign.status == "Scheduled")
        .order_by(Campaign.next_run_at.asc())
        .limit(6)
        .all()
    )

    scheduled_items = [
        {
            "id": campaign.id,
            "name": campaign.campaign_name,
            "status": campaign.status,
            "schedule_time": (
                campaign.schedule_time.isoformat()
                if campaign.schedule_time
                else None
            ),
            "next_run_at": (
                campaign.next_run_at.isoformat()
                if campaign.next_run_at
                else None
            ),
            "frequency": campaign.schedule_frequency,
            "channels": campaign.channels or [],
        }
        for campaign in scheduled_campaigns
    ]

    return {
        "role": current_user.role,
        "workspace": current_user.role,
        "users": total_users,
        "audience": total_audience,
        "campaigns": total_campaigns,
        "templates": total_templates,
        "campaign_status": campaign_status,
        "delivery_status": delivery_status,
        "delivery_channels": delivery_channels,
        "campaign_channels": dict(campaign_channel_counter),
        "user_roles": user_roles,
        "scheduled_campaigns": scheduled_items,
        "delivery": {
            "total": total_deliveries,
            "sent": sent_deliveries,
            "delivered": delivered_deliveries,
            "failed": failed_deliveries,
        },
        "engagement": {
            "opened": opened_deliveries,
            "clicked": clicked_deliveries,
            "engagement_rate": round(engagement_rate, 2),
            "delivery_success_rate": round(
                delivery_success_rate,
                2,
            ),
        },
    }
