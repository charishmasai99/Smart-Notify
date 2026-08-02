from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.db import get_db

from app.models.user import User
from app.models.audience import Audience
from app.models.campaign import Campaign
from app.models.template import Template

from app.utils.roles import require_communication_team

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


@router.get("/")
def dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_communication_team),
):
    total_users = db.query(User).count()
    total_audience = db.query(Audience).count()
    total_campaigns = db.query(Campaign).count()
    total_templates = db.query(Template).count()

    draft = db.query(Campaign).filter(
        Campaign.status == "Draft"
    ).count()

    pending = db.query(Campaign).filter(
        Campaign.status == "Pending Review"
    ).count()

    approved = db.query(Campaign).filter(
        Campaign.status == "Approved"
    ).count()

    scheduled = db.query(Campaign).filter(
        Campaign.status == "Scheduled"
    ).count()

    sending = db.query(Campaign).filter(
        Campaign.status == "Sending"
    ).count()

    completed = db.query(Campaign).filter(
        Campaign.status == "Completed"
    ).count()

    rejected = db.query(Campaign).filter(
        Campaign.status == "Rejected"
    ).count()

    return {
        "users": total_users,
        "audience": total_audience,
        "campaigns": total_campaigns,
        "templates": total_templates,
        "campaign_status": {
            "draft": draft,
            "pending_review": pending,
            "approved": approved,
            "scheduled": scheduled,
            "sending": sending,
            "completed": completed,
            "rejected": rejected
        }
    }