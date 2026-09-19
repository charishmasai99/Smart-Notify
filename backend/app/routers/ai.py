from datetime import datetime

from fastapi import (
    APIRouter,
    HTTPException,
    Depends,
)

from pydantic import BaseModel, Field

from sqlalchemy.orm import Session

from app.database.db import get_db

from app.models.campaign import Campaign
from app.models.user import User
from app.models.delivery import Delivery

from app.utils.roles import (
    require_admin,
    require_campaign_manager,
    require_communication_team,
)

from app.services.sms_service import send_sms

from app.services.email_service import send_email

from app.services.whatsapp_service import send_whatsapp

from app.services.ai_service import (
    generate_content,
    personalize_content,
    check_tone,
    translate_content,
    check_compliance,
)


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/ai",
    tags=["AI"],
)


# ============================================================
# 1. GENERATE CONTENT
# ============================================================

class GenerateContentRequest(BaseModel):

    brief: str = Field(
        ...,
        min_length=1,
    )

    campaign_type: str = "announcement"

    audience: str = "general public"

    tone: str = "professional"


class GenerateContentResponse(BaseModel):

    content: str


@router.post(
    "/generate-content",
    response_model=GenerateContentResponse,
)
def generate_campaign_content(
    request: GenerateContentRequest,

    current_user: User = Depends(
        require_campaign_manager
    ),
):

    try:

        content = generate_content(
            brief=request.brief,

            campaign_type=request.campaign_type,

            audience=request.audience,

            tone=request.tone,
        )

        return {
            "content": content
        }

    except Exception as error:

        raise HTTPException(
            status_code=500,

            detail=(
                "Content generation failed: "
                f"{str(error)}"
            ),
        )


# ============================================================
# 2. PERSONALIZATION
# ============================================================

class PersonalizationRequest(BaseModel):

    content: str = Field(
        ...,
        min_length=1,
    )

    audience: str = "general public"

    tone: str = "professional"

    personalization_fields: list[str] = [
        "first_name",
        "city",
    ]


class PersonalizationResponse(BaseModel):

    content: str

    audience: str

    tone: str


@router.post(
    "/personalize",
    response_model=PersonalizationResponse,
)
def personalize_campaign_content(
    request: PersonalizationRequest,

    current_user: User = Depends(
        require_campaign_manager
    ),
):

    try:

        personalized = personalize_content(
            content=request.content,

            audience=request.audience,

            tone=request.tone,

            personalization_fields=
                request.personalization_fields,
        )

        return {
            "content": personalized,

            "audience": request.audience,

            "tone": request.tone,
        }

    except Exception as error:

        raise HTTPException(
            status_code=500,

            detail=(
                "Personalization failed: "
                f"{str(error)}"
            ),
        )


# ============================================================
# 3. TONE / SENTIMENT
# ============================================================

class ToneCheckRequest(BaseModel):

    content: str = Field(
        ...,
        min_length=1,
    )


class ToneCheckResponse(BaseModel):

    analysis: str


@router.post(
    "/tone-check",
    response_model=ToneCheckResponse,
)
def tone_check(
    request: ToneCheckRequest,

    current_user: User = Depends(
        require_campaign_manager
    ),
):

    try:

        analysis = check_tone(
            content=request.content
        )

        return {
            "analysis": analysis
        }

    except Exception as error:

        raise HTTPException(
            status_code=500,

            detail=(
                "Tone check failed: "
                f"{str(error)}"
            ),
        )


# ============================================================
# 4. TRANSLATION
# ============================================================

class TranslationRequest(BaseModel):

    content: str = Field(
        ...,
        min_length=1,
    )

    target_language: str = Field(
        ...,
        min_length=1,
    )


class TranslationResponse(BaseModel):

    content: str

    language: str

    fallback: bool

    message: str


@router.post(
    "/translate",
    response_model=TranslationResponse,
)
def translate_campaign_content(
    request: TranslationRequest,

    current_user: User = Depends(
        require_campaign_manager
    ),
):

    try:

        result = translate_content(
            content=request.content,

            target_language=
                request.target_language,
        )

        return result

    except ValueError as error:

        raise HTTPException(
            status_code=400,

            detail=str(error),
        )

    except Exception as error:

        raise HTTPException(
            status_code=500,

            detail=(
                "Translation failed: "
                f"{str(error)}"
            ),
        )


# ============================================================
# 5. COMPLIANCE
# ============================================================

class ComplianceCheckRequest(BaseModel):

    content: str = Field(
        ...,
        min_length=1,
    )


class ComplianceCheckResponse(BaseModel):

    analysis: str


@router.post(
    "/compliance-check",
    response_model=ComplianceCheckResponse,
)
def compliance_check(
    request: ComplianceCheckRequest,

    current_user: User = Depends(
        require_campaign_manager
    ),
):

    try:

        result = check_compliance(
            content=request.content
        )

        return result

    except Exception as error:

        raise HTTPException(
            status_code=500,

            detail=(
                "Compliance check failed: "
                f"{str(error)}"
            ),
        )


# ============================================================
# 6. COMMUNICATION SIMULATION
# ============================================================

class SendSimulationRequest(BaseModel):

    channel: str

    recipient: str

    content: str

    subject: str = ""


class SendSimulationResponse(BaseModel):

    success: bool

    channel: str

    recipient: str

    subject: str

    content: str

    message: str


@router.post(
    "/send-simulation",
    response_model=SendSimulationResponse,
)
def send_simulation(
    request: SendSimulationRequest,

    current_user: User = Depends(
        require_campaign_manager
    ),
):

    try:

        supported_channels = {
            "email",
            "sms",
            "whatsapp",
            "push",
            "web_broadcast",
        }

        channel = (
            request.channel
            .lower()
            .strip()
        )

        if channel not in supported_channels:

            raise HTTPException(
                status_code=400,

                detail=(
                    f"Unsupported channel "
                    f"'{request.channel}'. "
                    "Supported channels: "
                    "email, sms, whatsapp, push, web_broadcast."
                ),
            )

        if not request.recipient.strip():

            raise HTTPException(
                status_code=400,

                detail="Recipient is required.",
            )

        if not request.content.strip():

            raise HTTPException(
                status_code=400,

                detail="Content is required.",
            )

        return {
            "success": True,

            "channel": channel,

            "recipient": request.recipient,

            "subject": request.subject,

            "content": request.content,

            "message": (
                "Simulation successful. "
                f"The campaign would be sent "
                f"through {channel}."
            ),
        }

    except HTTPException:
        raise

    except Exception as error:

        raise HTTPException(
            status_code=500,

            detail=(
                "Communication simulation failed: "
                f"{str(error)}"
            ),
        )


# ============================================================
# 7. REAL EMAIL
# ============================================================

class SendEmailRequest(BaseModel):

    campaign_id: int

    recipient: str

    subject: str

    content: str


@router.post(
    "/send-email"
)
def send_real_email(
    request: SendEmailRequest,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        require_communication_team
    ),
):

    # --------------------------------------------------------
    # VALIDATION
    # --------------------------------------------------------

    if not request.recipient.strip():

        raise HTTPException(
            status_code=400,
            detail="Recipient is required.",
        )

    if not request.subject.strip():

        raise HTTPException(
            status_code=400,
            detail="Subject is required.",
        )

    if not request.content.strip():

        raise HTTPException(
            status_code=400,
            detail="Content is required.",
        )

    # --------------------------------------------------------
    # FIND CAMPAIGN
    # --------------------------------------------------------

    campaign = (
        db.query(Campaign)
        .filter(
            Campaign.id == request.campaign_id
        )
        .first()
    )

    if not campaign:

        raise HTTPException(
            status_code=404,
            detail="Campaign not found.",
        )

    # --------------------------------------------------------
    # CREATE DELIVERY RECORD
    # --------------------------------------------------------

    delivery = Delivery(
        campaign_id=campaign.id,

        channel="Email",

        recipient=request.recipient,

        status="Sending",
    )

    db.add(delivery)

    campaign.status = "Sending"

    db.commit()

    db.refresh(delivery)

    # --------------------------------------------------------
    # SEND EMAIL
    # --------------------------------------------------------

    try:

        send_email(
            recipient=request.recipient,

            subject=request.subject,

            content=request.content,
        )

        # ----------------------------------------------
        # SUCCESS
        # ----------------------------------------------

        delivery.status = "Sent"

        delivery.sent_at = datetime.utcnow()

        campaign.status = "Completed"

        db.commit()

        db.refresh(delivery)

        return {
            "success": True,

            "campaign_id": campaign.id,

            "delivery_id": delivery.id,

            "recipient": request.recipient,

            "status": delivery.status,

            "message": "Email sent successfully.",
        }

    except Exception as error:

        # ----------------------------------------------
        # FAILURE
        # ----------------------------------------------

        delivery.status = "Failed"

        delivery.error_message = str(error)

        delivery.failed_at = datetime.utcnow()

        campaign.status = "Rejected"

        db.commit()

        raise HTTPException(
            status_code=500,

            detail=(
                "Email sending failed: "
                f"{str(error)}"
            ),
        )


# ============================================================
# 8. REAL SMS — TWILIO
# ============================================================

class SendSMSRequest(BaseModel):

    campaign_id: int

    recipient: str

    content: str


@router.post(
    "/send-sms"
)
def send_real_sms(
    request: SendSMSRequest,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        require_communication_team
    ),
):

    # --------------------------------------------------------
    # VALIDATION
    # --------------------------------------------------------

    if not request.recipient.strip():

        raise HTTPException(
            status_code=400,
            detail="Recipient is required.",
        )

    if not request.content.strip():

        raise HTTPException(
            status_code=400,
            detail="Content is required.",
        )

    # --------------------------------------------------------
    # FIND CAMPAIGN
    # --------------------------------------------------------

    campaign = (
        db.query(Campaign)
        .filter(
            Campaign.id == request.campaign_id
        )
        .first()
    )

    if not campaign:

        raise HTTPException(
            status_code=404,
            detail="Campaign not found.",
        )

    # --------------------------------------------------------
    # CREATE DELIVERY RECORD
    # --------------------------------------------------------

    delivery = Delivery(
        campaign_id=campaign.id,

        channel="SMS",

        recipient=request.recipient,

        status="Sending",
    )

    db.add(delivery)

    campaign.status = "Sending"

    db.commit()

    db.refresh(delivery)

    # --------------------------------------------------------
    # SEND SMS THROUGH TWILIO
    # --------------------------------------------------------

    try:

        result = send_sms(
            recipient=request.recipient,

            content=request.content,
        )

        # ----------------------------------------------
        # SAVE TWILIO MESSAGE SID
        # ----------------------------------------------

        delivery.provider_message_id = (
            result.get("message_sid")
        )

        # Twilio initially returns statuses such as
        # queued, accepted, sending, sent, etc.
        delivery.status = "Sent"

        delivery.sent_at = datetime.utcnow()

        campaign.status = "Completed"

        db.commit()

        db.refresh(delivery)

        return {
            "success": True,

            "campaign_id": campaign.id,

            "delivery_id": delivery.id,

            "recipient": request.recipient,

            "message_sid":
                result.get("message_sid"),

            "provider_status":
                result.get("status"),

            "status":
                delivery.status,

            "campaign_status":
                campaign.status,

            "message":
                "SMS sent successfully.",
        }

    except Exception as error:

        # ----------------------------------------------
        # SAVE FAILURE
        # ----------------------------------------------

        delivery.status = "Failed"

        delivery.error_message = str(error)

        delivery.failed_at = datetime.utcnow()

        campaign.status = "Rejected"

        db.commit()

        raise HTTPException(
            status_code=500,

            detail=(
                "SMS sending failed: "
                f"{str(error)}"
            ),
        )


# ============================================================
# 9. REAL WHATSAPP — META CLOUD API
# ============================================================

class SendWhatsAppRequest(BaseModel):

    campaign_id: int

    recipient: str

    content: str


@router.post(
    "/send-whatsapp"
)
def send_real_whatsapp(
    request: SendWhatsAppRequest,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        require_communication_team
    ),
):

    # --------------------------------------------------------
    # VALIDATION
    # --------------------------------------------------------

    if not request.recipient.strip():

        raise HTTPException(
            status_code=400,
            detail="Recipient is required.",
        )

    if not request.content.strip():

        raise HTTPException(
            status_code=400,
            detail="Content is required.",
        )

    # --------------------------------------------------------
    # FIND CAMPAIGN
    # --------------------------------------------------------

    campaign = (
        db.query(Campaign)
        .filter(
            Campaign.id == request.campaign_id
        )
        .first()
    )

    if not campaign:

        raise HTTPException(
            status_code=404,
            detail="Campaign not found.",
        )

    # --------------------------------------------------------
    # CREATE DELIVERY RECORD
    # --------------------------------------------------------

    delivery = Delivery(
        campaign_id=campaign.id,

        channel="WhatsApp",

        recipient=request.recipient,

        status="Sending",
    )

    db.add(delivery)

    campaign.status = "Sending"

    db.commit()

    db.refresh(delivery)

    # --------------------------------------------------------
    # SEND WHATSAPP
    # --------------------------------------------------------

    try:

        result = send_whatsapp(
            recipient=request.recipient,
content=request.content,
campaign_type=campaign.campaign_type,
campaign_name=campaign.campaign_name or "SmartNotify Campaign",
        )

        # ----------------------------------------------
        # SAVE META MESSAGE ID
        # ----------------------------------------------

        delivery.provider_message_id = (
            result.get("message_id")
        )

        delivery.status = "Sent"

        delivery.sent_at = datetime.utcnow()

        campaign.status = "Completed"

        db.commit()

        db.refresh(delivery)

        return {
            "success": True,

            "campaign_id": campaign.id,

            "delivery_id": delivery.id,

            "recipient": request.recipient,

            "message_id":
                result.get("message_id"),

            "status":
                delivery.status,

            "message":
                "WhatsApp message sent successfully.",

            "campaign_status":
                campaign.status,
        }

    except Exception as error:

        # ----------------------------------------------
        # SAVE FAILURE
        # ----------------------------------------------

        delivery.status = "Failed"

        delivery.error_message = str(error)

        delivery.failed_at = datetime.utcnow()

        campaign.status = "Rejected"

        db.commit()

        raise HTTPException(
            status_code=500,

            detail=(
                "WhatsApp sending failed: "
                f"{str(error)}"
            ),
        )