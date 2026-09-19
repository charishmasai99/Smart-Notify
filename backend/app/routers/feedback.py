from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from app.database.db import get_db

from app.models.feedback import Feedback
from app.models.campaign import Campaign
from app.models.delivery import Delivery

from app.schemas.feedback import (
    FeedbackCreate,
    FeedbackResponse,
)

from app.services.ai_service import (
    analyze_feedback_sentiment,
)

from app.utils.auth import get_current_user
from app.models.user import User


router = APIRouter(
    prefix="/feedback",
    tags=["Feedback"],
)
from pydantic import BaseModel, Field

from app.services.translation_service import (
    translate_text,
)


# ============================================================
# PUBLIC: GET FEEDBACK DETAILS
# ============================================================

@router.get("/response/{tracking_token}")
def get_feedback_response(
    tracking_token: str,
    db: Session = Depends(get_db),
):
    """
    Get campaign/delivery information using the
    unique email tracking token.

    This endpoint is public because the recipient
    does not need to log in to give feedback.
    """

    delivery = (
        db.query(Delivery)
        .filter(
            Delivery.tracking_token == tracking_token
        )
        .first()
    )

    if not delivery:
        raise HTTPException(
            status_code=404,
            detail="Invalid or expired feedback link.",
        )

    campaign = (
        db.query(Campaign)
        .filter(
            Campaign.id == delivery.campaign_id
        )
        .first()
    )

    if not campaign:
        raise HTTPException(
            status_code=404,
            detail="Campaign not found.",
        )

    return {
        "campaign_id": campaign.id,
        "campaign_name": campaign.campaign_name,
        "subject": campaign.subject,
        "delivery_id": delivery.id,
        "recipient": delivery.recipient,
        "channel": delivery.channel,
        "default_language": "English",
    }
# ============================================================
# FEEDBACK VOICE TRANSLATION
# ============================================================

class FeedbackTranslationRequest(BaseModel):

    content: str = Field(
        ...,
        min_length=1,
        max_length=5000,
    )

    source_language: str = Field(
        ...,
        min_length=1,
        max_length=30,
    )

    target_language: str = Field(
        ...,
        min_length=1,
        max_length=30,
    )

    feedback_id: int | None = None


@router.post("/translate")
def translate_feedback_content(
    request: FeedbackTranslationRequest,
    current_user: User = Depends(
        get_current_user
    ),
):
    """
    Translate recipient voice/text feedback
    into the selected Indian language.

    This endpoint is intentionally separate from
    the campaign translation endpoint because
    feedback recipients should not require
    campaign-manager permissions.
    """

    allowed_roles = {
        "User",
        "Admin",
        "Campaign Manager",
        "Communication Team",
    }

    if current_user.role not in allowed_roles:
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to translate feedback.",
        )

    source_language = request.source_language.strip()
    target_language = request.target_language.strip()

    if source_language.lower() == target_language.lower():
        return {
            "content": request.content.strip(),
            "language": target_language,
            "fallback": False,
            "message": "Source and target languages are the same.",
        }

    try:
        translated_text = translate_text(
            request.content,
            target_language,
            source_language=source_language,
        )

        return {
            "content": translated_text,
            "language": request.target_language,
            "fallback": False,
            "message": (
                "Feedback translated successfully."
            ),
        }

    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=(
                "Feedback translation failed: "
                f"{str(error)}"
            ),
        )

# ============================================================
# AUTHENTICATED RECIPIENT: SUBMIT FEEDBACK USING TOKEN
# ============================================================

@router.post(
    "/response/{tracking_token}",
    response_model=FeedbackResponse,
)
def submit_feedback_response(
    tracking_token: str,
    data: FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit feedback from the recipient feedback portal.

    Only accounts with the fixed public-recipient role ``User`` may
    submit feedback through this endpoint. The recipient identity is
    taken from the authenticated account instead of the request body.
    """

    allowed_roles = {
    "User",
}

    if current_user.role not in allowed_roles:
        raise HTTPException(
        status_code=403,
        detail=(
            "Only recipient accounts can "
            "submit feedback."
        ),
    )

    delivery = (
        db.query(Delivery)
        .filter(Delivery.tracking_token == tracking_token)
        .first()
    )

    if not delivery:
        raise HTTPException(
            status_code=404,
            detail="Invalid or expired feedback link.",
        )

    campaign = (
        db.query(Campaign)
        .filter(Campaign.id == delivery.campaign_id)
        .first()
    )

    if not campaign:
        raise HTTPException(
            status_code=404,
            detail="Campaign not found.",
        )

    # If the delivery has an email address, require the signed-in
    # recipient to match it. For non-email channels, the account is
    # still required but there may be no email identity in the delivery.
    delivery_recipient = str(delivery.recipient or "").strip().lower()
    user_email = str(current_user.email or "").strip().lower()

    if "@" in delivery_recipient and delivery_recipient != user_email:
        raise HTTPException(
            status_code=403,
            detail="This feedback link belongs to a different recipient.",
        )

    existing_feedback = (
        db.query(Feedback)
        .filter(Feedback.delivery_id == delivery.id)
        .first()
    )

    if existing_feedback:
        raise HTTPException(
            status_code=409,
            detail="Feedback has already been submitted for this message.",
        )

    feedback = Feedback(
        campaign_id=campaign.id,
        delivery_id=delivery.id,
        recipient=current_user.email,
        channel=delivery.channel,
        language=data.language.strip(),
        message=data.message.strip(),
        rating=data.rating,
        sentiment="Pending",
        sentiment_score=None,
    )

    db.add(feedback)
    db.commit()
    db.refresh(feedback)

    if data.message and data.message.strip():
        try:
            result = analyze_feedback_sentiment(data.message, data.language)
            feedback.sentiment = result.get("sentiment", "Pending")
            feedback.sentiment_score = result.get("score")
            db.commit()
            db.refresh(feedback)
        except Exception:
            feedback.sentiment = "Pending"
            feedback.sentiment_score = None
            db.commit()
            db.refresh(feedback)

    return feedback


# ============================================================
# CREATE FEEDBACK
# ============================================================

@router.post(
    "/",
    response_model=FeedbackResponse,
)
def create_feedback(
    data: FeedbackCreate,
    db: Session = Depends(get_db),
):

    campaign = (
        db.query(Campaign)
        .filter(
            Campaign.id == data.campaign_id
        )
        .first()
    )

    if not campaign:
        raise HTTPException(
            status_code=404,
            detail="Campaign not found.",
        )

    if data.delivery_id:

        delivery = (
            db.query(Delivery)
            .filter(
                Delivery.id == data.delivery_id
            )
            .first()
        )

        if not delivery:
            raise HTTPException(
                status_code=404,
                detail="Delivery not found.",
            )

    feedback = Feedback(
        campaign_id=data.campaign_id,
        delivery_id=data.delivery_id,
        recipient=data.recipient,
        channel=data.channel,
        language=data.language.strip(),
        message=data.message,
        rating=data.rating,
        sentiment="Pending",
        sentiment_score=None,
    )

    db.add(feedback)

    db.commit()
    db.refresh(feedback)

    try:

        result = analyze_feedback_sentiment(
            data.message
        )

        feedback.sentiment = (
            result.get("sentiment", "Pending")
        )

        feedback.sentiment_score = (
            result.get("score")
        )

        db.commit()
        db.refresh(feedback)

    except Exception:

        feedback.sentiment = "Pending"
        feedback.sentiment_score = None

        db.commit()
        db.refresh(feedback)

    return feedback


# ============================================================
# GET ALL FEEDBACK
# ============================================================

@router.get("/")
def get_feedback(
    db: Session = Depends(get_db),
):

    return (
        db.query(Feedback)
        .order_by(
            Feedback.created_at.desc()
        )
        .all()
    )


# ============================================================
# GET CAMPAIGN FEEDBACK
# ============================================================

@router.get(
    "/campaign/{campaign_id}"
)
def get_campaign_feedback(
    campaign_id: int,
    db: Session = Depends(get_db),
):

    campaign = (
        db.query(Campaign)
        .filter(
            Campaign.id == campaign_id
        )
        .first()
    )

    if not campaign:
        raise HTTPException(
            status_code=404,
            detail="Campaign not found.",
        )

    return (
        db.query(Feedback)
        .filter(
            Feedback.campaign_id == campaign_id
        )
        .order_by(
            Feedback.created_at.desc()
        )
        .all()
    )


# ============================================================
# FEEDBACK ANALYTICS
# ============================================================

@router.get("/analytics")
def feedback_analytics(
    db: Session = Depends(get_db),
):

    total = (
        db.query(
            func.count(Feedback.id)
        )
        .scalar()
        or 0
    )

    # ========================================================
    # PARTICIPATION / RESPONSE RATE
    # ========================================================

    # Total delivery attempts represent the full audience that
    # was targeted by campaigns.
    total_deliveries = (
        db.query(
            func.count(Delivery.id)
        )
        .scalar()
        or 0
    )

    # A reached audience member is represented by a delivery
    # that has successfully reached the recipient.
    reached_deliveries = (
        db.query(
            func.count(Delivery.id)
        )
        .filter(
            or_(
                Delivery.delivered_at.isnot(None),
                Delivery.status.in_(
                    [
                        "Sent",
                        "sent",
                        "Delivered",
                        "delivered",
                        "Read",
                        "read",
                        "Completed",
                        "completed",
                    ]
                ),
            )
        )
        .scalar()
        or 0
    )

    # Recipient response count = all stored feedback records.
    # This intentionally includes seeded/demo feedback as well as
    # real recipient submissions. Every submitted feedback action
    # counts as one response, regardless of whether an older seeded
    # record has a delivery_id attached.
    response_count = (
        db.query(
            func.count(Feedback.id)
        )
        .scalar()
        or 0
    )

    # Participation = feedback responses compared with the
    # complete delivery audience.
    participation_rate = (
        round(
            min(
                response_count / total_deliveries * 100,
                100,
            ),
            2,
        )
        if total_deliveries
        else 0
    )

    # Response rate = recipient feedback responses compared with
    # the audience that was actually reached.
    response_rate = (
        round(
            min(
                response_count / reached_deliveries * 100,
                100,
            ),
            2,
        )
        if reached_deliveries
        else 0
    )

    positive = (
        db.query(
            func.count(Feedback.id)
        )
        .filter(
            func.lower(Feedback.sentiment)
            == "positive"
        )
        .scalar()
        or 0
    )

    neutral = (
        db.query(
            func.count(Feedback.id)
        )
        .filter(
            func.lower(Feedback.sentiment)
            == "neutral"
        )
        .scalar()
        or 0
    )

    negative = (
        db.query(
            func.count(Feedback.id)
        )
        .filter(
            func.lower(Feedback.sentiment)
            == "negative"
        )
        .scalar()
        or 0
    )

    average_rating = (
        db.query(
            func.avg(
                Feedback.rating
            )
        )
        .scalar()
    )

    if average_rating is not None:

        average_rating = round(
            float(average_rating),
            2,
        )

    language_rows = (
        db.query(
            Feedback.language,
            func.count(Feedback.id),
        )
        .group_by(Feedback.language)
        .order_by(func.count(Feedback.id).desc())
        .all()
    )

    language_breakdown = [
        {
            "language": language or "English",
            "count": count,
            "percentage": round(count / total * 100, 2) if total else 0,
        }
        for language, count in language_rows
    ]

    return {

        "total_feedback": total,
        "response_count": response_count,
        "total_deliveries": total_deliveries,

        "reached_deliveries": reached_deliveries,

        "participation_rate": participation_rate,

        "response_rate": response_rate,

        "positive": positive,

        "neutral": neutral,

        "negative": negative,

        "positive_rate": (
            round(
                positive / total * 100,
                2,
            )
            if total
            else 0
        ),

        "neutral_rate": (
            round(
                neutral / total * 100,
                2,
            )
            if total
            else 0
        ),

        "negative_rate": (
            round(
                negative / total * 100,
                2,
            )
            if total
            else 0
        ),

        "average_rating": average_rating,

        "language_breakdown": language_breakdown,
    }