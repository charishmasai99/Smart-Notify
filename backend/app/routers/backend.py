from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.models.user import User
from app.models.audience import Audience
from app.models.campaign import Campaign
from app.models.template import Template
router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)
@router.get("/")
def get_dashboard(
    db: Session = Depends(get_db)
):

    total_users = db.query(User).count()

    total_audience = db.query(Audience).count()

    total_campaigns = db.query(Campaign).count()

    total_templates = db.query(Template).count()

    draft_campaigns = db.query(Campaign).filter(
        Campaign.status == "Draft"
    ).count()

    scheduled_campaigns = db.query(Campaign).filter(
        Campaign.status == "Scheduled"
    ).count()

    sent_campaigns = db.query(Campaign).filter(
        Campaign.status == "Sent"
    ).count()

    return {
        "total_users": total_users,
        "total_audience": total_audience,
        "total_campaigns": total_campaigns,
        "draft_campaigns": draft_campaigns,
        "scheduled_campaigns": scheduled_campaigns,
        "sent_campaigns": sent_campaigns,
        "total_templates": total_templates
    }