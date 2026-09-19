from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.db import get_db

from app.models.audience import Audience
from app.models.audience_member import AudienceMember
from app.models.campaign import Campaign
from app.models.user import User

from app.schemas.audience import (
    AudienceCreate,
    AudienceResponse,
)

from app.utils.roles import (
    require_workspace_user,
    require_campaign_manager,
    require_communication_team,
)


router = APIRouter(
    prefix="/audience",
    tags=["Audience"],
)


# ============================================================
# CREATE AUDIENCE
# ============================================================

@router.post("/", response_model=AudienceResponse)
def create_audience(
    audience: AudienceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_campaign_manager),
):
    new_audience = Audience(
        name=audience.name,
        audience_type=audience.audience_type,
        description=audience.description,
        state=audience.state,
        gender=audience.gender,
        language=audience.language,
        occupation=audience.occupation,
    )

    db.add(new_audience)
    db.commit()
    db.refresh(new_audience)

    return new_audience


# ============================================================
# GET ALL AUDIENCES
# ============================================================

@router.get("/", response_model=list[AudienceResponse])
def get_audiences(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_workspace_user),
):
    return db.query(Audience).all()


# ============================================================
# GET AUDIENCE BY ID
# ============================================================

@router.get("/{audience_id}", response_model=AudienceResponse)
def get_audience_by_id(
    audience_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_workspace_user),
):
    audience = (
        db.query(Audience)
        .filter(Audience.id == audience_id)
        .first()
    )

    if not audience:
        raise HTTPException(
            status_code=404,
            detail="Audience not found",
        )

    return audience


# ============================================================
# UPDATE AUDIENCE
# ============================================================

@router.put("/{audience_id}", response_model=AudienceResponse)
def update_audience(
    audience_id: int,
    updated_audience: AudienceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_campaign_manager),
):
    audience = (
        db.query(Audience)
        .filter(Audience.id == audience_id)
        .first()
    )

    if not audience:
        raise HTTPException(
            status_code=404,
            detail="Audience not found",
        )

    audience.name = updated_audience.name
    audience.audience_type = updated_audience.audience_type
    audience.description = updated_audience.description
    audience.state = updated_audience.state
    audience.gender = updated_audience.gender
    audience.language = updated_audience.language
    audience.occupation = updated_audience.occupation

    db.commit()
    db.refresh(audience)

    return audience


# ============================================================
# DELETE AUDIENCE
# ============================================================

@router.delete("/{audience_id}")
def delete_audience(
    audience_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_campaign_manager),
):
    audience = (
        db.query(Audience)
        .filter(Audience.id == audience_id)
        .first()
    )

    if not audience:
        raise HTTPException(
            status_code=404,
            detail="Audience not found",
        )

    # Campaigns keep their own records, so deleting an audience must not
    # violate the nullable Campaign.audience_id foreign key. Detach the
    # audience from existing campaigns first, then remove the audience.
    db.query(Campaign).filter(
        Campaign.audience_id == audience_id
    ).update(
        {Campaign.audience_id: None},
        synchronize_session=False,
    )

    db.delete(audience)
    db.commit()

    return {
        "message": "Audience deleted successfully"
    }


# ============================================================
# FILTER AUDIENCE
# ============================================================

@router.get("/filter", response_model=list[AudienceResponse])
def filter_audience(
    state: str | None = None,
    gender: str | None = None,
    language: str | None = None,
    occupation: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_workspace_user),
):
    query = db.query(Audience)

    if state:
        query = query.filter(Audience.state == state)

    if gender:
        query = query.filter(Audience.gender == gender)

    if language:
        query = query.filter(Audience.language == language)

    if occupation:
        query = query.filter(Audience.occupation == occupation)

    return query.all()

# ============================================================
# ADD USER TO AUDIENCE
# ============================================================

@router.post("/{audience_id}/members/{user_id}")
def add_audience_member(
    audience_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_campaign_manager),
):

    audience = (
        db.query(Audience)
        .filter(Audience.id == audience_id)
        .first()
    )

    if not audience:
        raise HTTPException(
            status_code=404,
            detail="Audience not found",
        )

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    existing = (
        db.query(AudienceMember)
        .filter(
            AudienceMember.audience_id == audience_id,
            AudienceMember.user_id == user_id,
        )
        .first()
    )

    if existing:
        return {
            "message": "User is already in this audience",
            "audience_id": audience_id,
            "user_id": user_id,
        }

    member = AudienceMember(
        audience_id=audience_id,
        user_id=user_id,
    )

    db.add(member)
    db.commit()
    db.refresh(member)

    return {
        "message": "User added to audience successfully",
        "audience_id": audience_id,
        "user_id": user_id,
        "member_id": member.id,
    }


# ============================================================
# GET AUDIENCE MEMBERS
# ============================================================

@router.get("/{audience_id}/members")
def get_audience_members(
    audience_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_workspace_user),
):

    audience = (
        db.query(Audience)
        .filter(Audience.id == audience_id)
        .first()
    )

    if not audience:
        raise HTTPException(
            status_code=404,
            detail="Audience not found",
        )

    members = (
        db.query(AudienceMember, User)
        .join(
            User,
            User.id == AudienceMember.user_id,
        )
        .filter(
            AudienceMember.audience_id == audience_id
        )
        .all()
    )

    return [
        {
            "member_id": member.id,
            "user_id": user.id,
            "name": user.name,
            "email": user.email,
            "has_fcm_token": bool(user.fcm_token),
        }
        for member, user in members
    ]


# ============================================================
# REMOVE USER FROM AUDIENCE
# ============================================================

@router.delete("/{audience_id}/members/{user_id}")
def remove_audience_member(
    audience_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_campaign_manager),
):

    member = (
        db.query(AudienceMember)
        .filter(
            AudienceMember.audience_id == audience_id,
            AudienceMember.user_id == user_id,
        )
        .first()
    )

    if not member:
        raise HTTPException(
            status_code=404,
            detail="Audience member not found",
        )

    db.delete(member)
    db.commit()

    return {
        "message": "User removed from audience successfully",
        "audience_id": audience_id,
        "user_id": user_id,
    }
