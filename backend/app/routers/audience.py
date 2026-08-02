from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.db import get_db

from app.models.audience import Audience
from app.models.user import User

from app.schemas.audience import (
    AudienceCreate,
    AudienceResponse,
)

from app.utils.roles import (
    require_campaign_manager,
    require_communication_team,
)

router = APIRouter(
    prefix="/audience",
    tags=["Audience"],
)


# Create Audience
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
        district=audience.district,
        gender=audience.gender,
        language=audience.language,
        occupation=audience.occupation,
    )

    db.add(new_audience)
    db.commit()
    db.refresh(new_audience)

    return new_audience


# Get All Audiences
@router.get("/", response_model=list[AudienceResponse])
def get_audiences(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_communication_team),
):
    return db.query(Audience).all()


# Get Audience By ID
@router.get("/{audience_id}", response_model=AudienceResponse)
def get_audience_by_id(
    audience_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_communication_team),
):
    audience = db.query(Audience).filter(
        Audience.id == audience_id
    ).first()

    if not audience:
        raise HTTPException(
            status_code=404,
            detail="Audience not found",
        )

    return audience


# Update Audience
@router.put("/{audience_id}", response_model=AudienceResponse)
def update_audience(
    audience_id: int,
    updated_audience: AudienceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_campaign_manager),
):
    audience = db.query(Audience).filter(
        Audience.id == audience_id
    ).first()

    if not audience:
        raise HTTPException(
            status_code=404,
            detail="Audience not found",
        )

    audience.name = updated_audience.name
    audience.audience_type = updated_audience.audience_type
    audience.description = updated_audience.description
    audience.state = updated_audience.state
    audience.district = updated_audience.district
    audience.gender = updated_audience.gender
    audience.language = updated_audience.language
    audience.occupation = updated_audience.occupation

    db.commit()
    db.refresh(audience)

    return audience


# Delete Audience
@router.delete("/{audience_id}")
def delete_audience(
    audience_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_campaign_manager),
):
    audience = db.query(Audience).filter(
        Audience.id == audience_id
    ).first()

    if not audience:
        raise HTTPException(
            status_code=404,
            detail="Audience not found",
        )

    db.delete(audience)
    db.commit()

    return {
        "message": "Audience deleted successfully"
    }


# Filter Audience
@router.get("/filter", response_model=list[AudienceResponse])
def filter_audience(
    state: str | None = None,
    district: str | None = None,
    gender: str | None = None,
    language: str | None = None,
    occupation: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_communication_team),
):
    query = db.query(Audience)

    if state:
        query = query.filter(Audience.state == state)

    if district:
        query = query.filter(Audience.district == district)

    if gender:
        query = query.filter(Audience.gender == gender)

    if language:
        query = query.filter(Audience.language == language)

    if occupation:
        query = query.filter(Audience.occupation == occupation)

    return query.all()