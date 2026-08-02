from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.models.campaign import Campaign
from app.models.user import User

from app.schemas.campaign import (
    CampaignCreate,
    CampaignUpdate,
    CampaignResponse,
)

from app.utils.roles import (
    require_campaign_manager,
    require_communication_team,
)

router = APIRouter(
    prefix="/campaign",
    tags=["Campaign"],
)

VALID_STATUS = [
    "Draft",
    "Pending Review",
    "Approved",
    "Scheduled",
    "Sending",
    "Completed",
    "Rejected",
]

WORKFLOW = {
    "Draft": ["Pending Review"],

    "Pending Review": [
        "Approved",
        "Rejected",
    ],

    "Rejected": [
        "Draft",
    ],

    "Approved": [
        "Scheduled",
    ],

    "Scheduled": [
        "Sending",
    ],

    "Sending": [
        "Completed",
    ],

    "Completed": [],
}


@router.post("/", response_model=CampaignResponse)
def create_campaign(
    campaign: CampaignCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_campaign_manager),
):
    if campaign.status not in VALID_STATUS:
        raise HTTPException(
            status_code=400,
            detail="Invalid campaign status.",
        )

    new_campaign = Campaign(
        campaign_name=campaign.campaign_name,
        subject=campaign.subject,
        content=campaign.content,
        audience_id=campaign.audience_id,
        schedule_time=campaign.schedule_time,
        status=campaign.status,
    )

    db.add(new_campaign)
    db.commit()
    db.refresh(new_campaign)

    return new_campaign


@router.get("/", response_model=list[CampaignResponse])
def get_campaigns(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_communication_team),
):
    return db.query(Campaign).all()


@router.get("/{campaign_id}", response_model=CampaignResponse)
def get_campaign(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_communication_team),
):
    campaign = db.query(Campaign).filter(
        Campaign.id == campaign_id
    ).first()

    if not campaign:
        raise HTTPException(
            status_code=404,
            detail="Campaign not found",
        )

    return campaign


@router.put("/{campaign_id}", response_model=CampaignResponse)
def update_campaign(
    campaign_id: int,
    campaign_update: CampaignUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_campaign_manager),
):
    campaign = db.query(Campaign).filter(
        Campaign.id == campaign_id
    ).first()

    if not campaign:
        raise HTTPException(
            status_code=404,
            detail="Campaign not found",
        )

    if campaign_update.status not in VALID_STATUS:
        raise HTTPException(
            status_code=400,
            detail="Invalid campaign status.",
        )

    current_status = campaign.status

    if campaign_update.status != current_status:

        allowed_status = WORKFLOW.get(current_status, [])

        if campaign_update.status not in allowed_status:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot change status from '{current_status}' to '{campaign_update.status}'.",
            )

    campaign.campaign_name = campaign_update.campaign_name
    campaign.subject = campaign_update.subject
    campaign.content = campaign_update.content
    campaign.audience_id = campaign_update.audience_id
    campaign.schedule_time = campaign_update.schedule_time
    campaign.status = campaign_update.status

    db.commit()
    db.refresh(campaign)

    return campaign


@router.delete("/{campaign_id}")
def delete_campaign(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_campaign_manager),
):
    campaign = db.query(Campaign).filter(
        Campaign.id == campaign_id
    ).first()

    if not campaign:
        raise HTTPException(
            status_code=404,
            detail="Campaign not found",
        )

    db.delete(campaign)
    db.commit()

    return {
        "message": "Campaign deleted successfully"
    }