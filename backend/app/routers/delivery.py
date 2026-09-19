from datetime import datetime

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.db import get_db

from app.models.delivery import Delivery
from app.models.campaign import Campaign
from app.models.user import User

from app.utils.roles import (
    require_communication_team,
    require_workspace_user,
)

from app.services.whatsapp_service import (
    send_whatsapp,
)

from app.services.email_service import (
    send_email,
)

from app.services.sms_service import (
    send_sms,
)

from app.services.notification_service import (
    send_push_notification,
)


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/delivery",
    tags=["Delivery"],
)


# ============================================================
# CONFIGURATION
# ============================================================

MAX_RETRIES = 3


# ============================================================
# DELIVERY SERIALIZER
# ============================================================

def delivery_to_dict(
    delivery: Delivery,
):

    return {

        "id":
            delivery.id,

        "campaign_id":
            delivery.campaign_id,

        "channel":
            delivery.channel,

        "recipient":
            delivery.recipient,

        "provider_message_id":
            delivery.provider_message_id,

        "status":
            delivery.status,

        "error_message":
            delivery.error_message,

        "retry_count":
            delivery.retry_count,

        "next_retry_at":
            delivery.next_retry_at,

        "created_at":
            delivery.created_at,

        "sent_at":
            delivery.sent_at,

        "delivered_at":
            delivery.delivered_at,

        "failed_at":
            delivery.failed_at,

        "opened_at":
            delivery.opened_at,

        "clicked_at":
            delivery.clicked_at,

        "click_count":
            delivery.click_count,

        "tracking_token":
            delivery.tracking_token,

    }


# ============================================================
# GET CAMPAIGNS
# ============================================================

@router.get(
    "/campaigns"
)
def get_delivery_campaigns(
    db: Session = Depends(
        get_db
    ),
    current_user: User = Depends(
        require_workspace_user
    ),
):
    """Return campaigns for the Delivery Tracking selector."""

    campaigns = (
    db.query(Campaign)
    .filter(
        db.query(Delivery.id)
        .filter(Delivery.campaign_id == Campaign.id)
        .exists()
    )
    .order_by(Campaign.id.desc())
    .all()
)

    return [
        {
            "id": campaign.id,
            "campaign_id": campaign.id,
            "campaign_name": getattr(
                campaign,
                "campaign_name",
                None,
            ),
            "name": getattr(
                campaign,
                "campaign_name",
                None,
            ),
            "campaign_type": getattr(
                campaign,
                "campaign_type",
                None,
            ),
            "subject": getattr(
                campaign,
                "subject",
                None,
            ),
            "status": getattr(
                campaign,
                "status",
                None,
            ),
            "created_at": getattr(
                campaign,
                "created_at",
                None,
            ),
        }
        for campaign in campaigns
    ]


# ============================================================
# GET CAMPAIGN DELIVERIES
# ============================================================

@router.get(
    "/campaign/{campaign_id}"
)
def get_campaign_deliveries(

    campaign_id: int,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        require_workspace_user
    ),

):

    deliveries = (

        db.query(
            Delivery
        )

        .filter(
            Delivery.campaign_id
            ==
            campaign_id
        )

        .order_by(
            Delivery.created_at.desc()
        )

        .all()

    )

    return [

        delivery_to_dict(
            delivery
        )

        for delivery in deliveries

    ]


# ============================================================
# DELIVERY SUMMARY
# ============================================================

@router.get(
    "/summary"
)
def get_delivery_summary(

    campaign_id: int | None = None,

    channel: str | None = None,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        require_workspace_user
    ),

):

    query = db.query(
        Delivery
    )

    if campaign_id is not None:

        query = query.filter(
            Delivery.campaign_id
            ==
            campaign_id
        )

    if channel:

        query = query.filter(
            func.lower(
                Delivery.channel
            )
            ==
            channel.lower()
        )

    deliveries = query.all()

    total = len(
        deliveries
    )

    queued = sum(
        1
        for item in deliveries
        if item.status == "Queued"
    )

    sending = sum(
        1
        for item in deliveries
        if item.status == "Sending"
    )

    sent = sum(
        1
        for item in deliveries
        if item.status in {
            "Sent",
            "Read",
            "Delivered",
            "Completed",
        }
    )

    delivered = sum(
        1
        for item in deliveries
        if item.delivered_at is not None
    )

    failed = sum(
        1
        for item in deliveries
        if item.status == "Failed"
    )

    retrying = sum(
        1
        for item in deliveries
        if item.status == "Retrying"
    )

    pending = (
        queued
        + sending
        + retrying
    )

    delivery_rate = (
        round(
            (
                delivered
                /
                sent
            )
            * 100,
            2,
        )
        if sent
        else 0
    )

    failure_rate = (
        round(
            (
                failed
                /
                total
            )
            * 100,
            2,
        )
        if total
        else 0
    )

    return {

        "total": total,

        "queued": queued,

        "sending": sending,

        "sent": sent,

        "delivered": delivered,

        "failed": failed,

        "retrying": retrying,

        "pending": pending,

        "delivery_rate": delivery_rate,

        "failure_rate": failure_rate,

    }


# ============================================================
# DELIVERY ANALYTICS
# ============================================================

@router.get(
    "/analytics"
)
def get_delivery_analytics(

    campaign_id: int | None = None,

    channel: str | None = None,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        require_workspace_user
    ),

):

    query = db.query(
        Delivery
    )

    if campaign_id is not None:

        query = query.filter(
            Delivery.campaign_id
            ==
            campaign_id
        )

    if channel:

        query = query.filter(
            func.lower(
                Delivery.channel
            )
            ==
            channel.lower()
        )

    deliveries = query.all()

    if not deliveries:

        return {

            "total_messages": 0,

            "sent": 0,

            "delivered": 0,

            "failed": 0,

            "opened": 0,

            "clicked": 0,

            "total_clicks": 0,

            "delivery_rate": 0,

            "open_rate": 0,

            "click_rate": 0,

            "engagement_rate": 0,

            "channels": {},

            "campaigns": {},

        }

    total_messages = len(
        deliveries
    )

    sent = sum(

        1

        for item in deliveries

        if item.status in {

            "Sent",
            "Read",
            "Completed",
            "Delivered",

        }

    )

    delivered = sum(

        1

        for item in deliveries

        if item.delivered_at
        is not None

    )

    failed = sum(

        1

        for item in deliveries

        if item.status
        ==
        "Failed"

    )

    opened = sum(

        1

        for item in deliveries

        if item.opened_at
        is not None

    )

    clicked = sum(

        1

        for item in deliveries

        if item.clicked_at
        is not None

    )

    total_clicks = sum(

        item.click_count or 0

        for item in deliveries

    )

    delivery_rate = (

        round(
            (
                delivered
                /
                sent
            )
            * 100,
            2,
        )

        if sent

        else 0

    )

    open_rate = (

        round(
            (
                opened
                /
                sent
            )
            * 100,
            2,
        )

        if sent

        else 0

    )

    click_rate = (

        round(
            (
                clicked
                /
                sent
            )
            * 100,
            2,
        )

        if sent

        else 0

    )

    engaged = sum(

        1

        for item in deliveries

        if item.opened_at is not None
        or item.clicked_at is not None

    )

    engagement_rate = (

        round(
            (
                engaged
                /
                sent
            )
            * 100,
            2,
        )

        if sent

        else 0

    )

    # ========================================================
    # CHANNEL ANALYTICS
    # ========================================================

    channel_data = {}

    for item in deliveries:

        # Normalize legacy/inconsistent channel names so analytics
        # combines values such as "SMS"/"Sms"/"sms" into one
        # channel and "WhatsApp"/"Whatsapp" into one channel.
        raw_channel = (
            str(item.channel or "")
            .strip()
            .lower()
        )

        channel_aliases = {
            "email": "email",
            "e-mail": "email",

            "sms": "sms",
            "text": "sms",

            "whatsapp": "whatsapp",
            "whatapp": "whatsapp",

            "push": "push",
            "push notification": "push",

            "web_broadcast": "web_broadcast",
            "web broadcast": "web_broadcast",
            "webbroadcast": "web_broadcast",
        }

        channel_key = channel_aliases.get(
            raw_channel,
            raw_channel or "unknown"
        )

        channel_name = {
            "email": "Email",
            "sms": "SMS",
            "whatsapp": "WhatsApp",
            "push": "Push",
            "web_broadcast": "Web Broadcast",
        }.get(
            channel_key,
            "Unknown"
        )

        if channel_name not in channel_data:

            channel_data[
                channel_name
            ] = {

                "messages": 0,

                "sent": 0,

                "delivered": 0,

                "failed": 0,

                "opened": 0,

                "clicked": 0,

                "clicks": 0,

            }

        stats = channel_data[
            channel_name
        ]

        stats[
            "messages"
        ] += 1

        if item.status in {

            "Sent",
            "Read",
            "Completed",
            "Delivered",

        }:

            stats[
                "sent"
            ] += 1

        if item.delivered_at:

            stats[
                "delivered"
            ] += 1

        if item.status == "Failed":

            stats[
                "failed"
            ] += 1

        if item.opened_at:

            stats[
                "opened"
            ] += 1

        if item.clicked_at:

            stats[
                "clicked"
            ] += 1

        stats[
            "clicks"
        ] += (
            item.click_count
            or
            0
        )

    # ========================================================
    # CAMPAIGN ANALYTICS
    # ========================================================

    campaign_data = {}

    for item in deliveries:

        campaign_key = str(
            item.campaign_id
        )

        if campaign_key not in campaign_data:

            campaign_data[
                campaign_key
            ] = {

                "campaign_id":
                    item.campaign_id,

                "messages":
                    0,

                "sent":
                    0,

                "delivered":
                    0,

                "failed":
                    0,

                "opened":
                    0,

                "clicked":
                    0,

                "clicks":
                    0,

            }

        stats = campaign_data[
            campaign_key
        ]

        stats[
            "messages"
        ] += 1

        if item.status in {

            "Sent",
            "Read",
            "Completed",
            "Delivered",

        }:

            stats[
                "sent"
            ] += 1

        if item.delivered_at:

            stats[
                "delivered"
            ] += 1

        if item.status == "Failed":

            stats[
                "failed"
            ] += 1

        if item.opened_at:

            stats[
                "opened"
            ] += 1

        if item.clicked_at:

            stats[
                "clicked"
            ] += 1

        stats[
            "clicks"
        ] += (
            item.click_count
            or
            0
        )

    return {

        "total_messages":
            total_messages,

        "sent":
            sent,

        "delivered":
            delivered,

        "failed":
            failed,

        "opened":
            opened,

        "clicked":
            clicked,

        "total_clicks":
            total_clicks,

        "delivery_rate":
            delivery_rate,

        "open_rate":
            open_rate,

        "click_rate":
            click_rate,

        "engagement_rate":
            engagement_rate,

        "channels":
            channel_data,

        "campaigns":
            campaign_data,

    }


# ============================================================
# GET FAILED DELIVERIES
# ============================================================

@router.get(
    "/failed"
)
def get_failed_deliveries(

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        require_workspace_user
    ),

):

    deliveries = (

        db.query(
            Delivery
        )

        .filter(
            Delivery.status
            ==
            "Failed"
        )

        .order_by(
            Delivery.created_at.desc()
        )

        .all()

    )

    return [

        delivery_to_dict(
            delivery
        )

        for delivery in deliveries

    ]


# ============================================================
# MARK DELIVERY DELIVERED
# ============================================================

@router.post(
    "/{delivery_id}/delivered"
)
def mark_delivery_delivered(

    delivery_id: int,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        require_communication_team
    ),
):

    delivery = (

        db.query(
            Delivery
        )

        .filter(
            Delivery.id
            ==
            delivery_id
        )

        .first()

    )

    if not delivery:

        raise HTTPException(

            status_code=404,

            detail=
                "Delivery not found.",

        )

    if delivery.status == "Failed":

        raise HTTPException(

            status_code=400,

            detail=(
                "Failed delivery "
                "cannot be marked "
                "as delivered."
            ),

        )

    delivery.delivered_at = (
        datetime.utcnow()
    )

    if delivery.status in {
        "Sent",
        "Sending",
        "Retrying",
    }:

        delivery.status = "Delivered"

    db.commit()

    db.refresh(
        delivery
    )

    return {

        "success":
            True,

        "delivery_id":
            delivery.id,

        "status":
            delivery.status,

        "delivered_at":
            delivery.delivered_at,

        "message":
            "Delivery marked as delivered.",

    }


# ============================================================
# MANUAL ENGAGEMENT — MARK AS READ
#
# Presentation/demo fallback:
# The real WhatsApp "Read" status is still handled by the
# WhatsApp webhook. This endpoint lets the Communication Team
# explicitly record a read event when the external webhook is
# unavailable during local/demo operation.
# ============================================================

@router.post(
    "/{delivery_id}/read"
)
def mark_delivery_read(
    delivery_id: int,
    db: Session = Depends(
        get_db
    ),
    current_user: User = Depends(
        require_communication_team
    ),
):
    delivery = (
        db.query(
            Delivery
        )
        .filter(
            Delivery.id
            ==
            delivery_id
        )
        .first()
    )

    if not delivery:
        raise HTTPException(
            status_code=404,
            detail="Delivery not found.",
        )

    if delivery.status == "Failed":
        raise HTTPException(
            status_code=400,
            detail="Failed delivery cannot be marked as read.",
        )

    now = datetime.utcnow()

    if not delivery.opened_at:
        delivery.opened_at = now

    if delivery.status in {
        "Sent",
        "Delivered",
        "Sending",
        "Retrying",
    }:
        delivery.status = "Read"

    db.commit()
    db.refresh(
        delivery
    )

    return {
        "success": True,
        "delivery_id": delivery.id,
        "status": delivery.status,
        "opened_at": delivery.opened_at,
        "message": "Delivery marked as read.",
    }


# ============================================================
# MANUAL ENGAGEMENT — RECORD CLICK
#
# Presentation/demo fallback:
# The production click path can use /tracking/click/{token}.
# This endpoint provides a safe authenticated fallback for
# demonstrating click analytics when a channel does not expose
# native click callbacks.
# ============================================================

@router.post(
    "/{delivery_id}/click"
)
def mark_delivery_clicked(
    delivery_id: int,
    db: Session = Depends(
        get_db
    ),
    current_user: User = Depends(
        require_communication_team
    ),
):
    delivery = (
        db.query(
            Delivery
        )
        .filter(
            Delivery.id
            ==
            delivery_id
        )
        .first()
    )

    if not delivery:
        raise HTTPException(
            status_code=404,
            detail="Delivery not found.",
        )

    if delivery.status == "Failed":
        raise HTTPException(
            status_code=400,
            detail="Failed delivery cannot record a click.",
        )

    now = datetime.utcnow()

    if not delivery.opened_at:
        delivery.opened_at = now

    if not delivery.clicked_at:
        delivery.clicked_at = now

    delivery.click_count = (
        delivery.click_count or 0
    ) + 1

    if delivery.status in {
        "Sent",
        "Delivered",
        "Sending",
        "Retrying",
    }:
        delivery.status = "Read"

    db.commit()
    db.refresh(
        delivery
    )

    return {
        "success": True,
        "delivery_id": delivery.id,
        "status": delivery.status,
        "opened_at": delivery.opened_at,
        "clicked_at": delivery.clicked_at,
        "click_count": delivery.click_count,
        "message": "Delivery click recorded.",
    }


# ============================================================
# GET SINGLE DELIVERY
# ============================================================

@router.get(
    "/{delivery_id}"
)
def get_delivery(

    delivery_id: int,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        require_workspace_user
    ),

):

    delivery = (

        db.query(
            Delivery
        )

        .filter(
            Delivery.id
            ==
            delivery_id
        )

        .first()

    )

    if not delivery:

        raise HTTPException(

            status_code=404,

            detail=
                "Delivery not found.",

        )

    return delivery_to_dict(
        delivery
    )


# ============================================================
# RETRY DELIVERY
# ============================================================

@router.post(
    "/{delivery_id}/retry"
)
def retry_delivery(

    delivery_id: int,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        require_communication_team
    ),

):

    # ========================================================
    # FIND DELIVERY
    # ========================================================

    delivery = (

        db.query(
            Delivery
        )

        .filter(
            Delivery.id
            ==
            delivery_id
        )

        .first()

    )

    if not delivery:

        raise HTTPException(

            status_code=404,

            detail=
                "Delivery not found.",

        )

    # ========================================================
    # FAILED ONLY
    # ========================================================

    if delivery.status != "Failed":

        raise HTTPException(

            status_code=400,

            detail=(
                "Only failed deliveries "
                "can be retried."
            ),

        )

    # ========================================================
    # MAX RETRIES
    # ========================================================

    if delivery.retry_count >= MAX_RETRIES:

        raise HTTPException(

            status_code=400,

            detail=(
                f"Maximum retry limit "
                f"({MAX_RETRIES}) reached."
            ),

        )

    # ========================================================
    # GET CAMPAIGN
    # ========================================================

    campaign = (

        db.query(
            Campaign
        )

        .filter(
            Campaign.id
            ==
            delivery.campaign_id
        )

        .first()

    )

    if not campaign:

        raise HTTPException(

            status_code=404,

            detail=
                "Original campaign not found.",

        )

    # ========================================================
    # CAMPAIGN CONTENT
    # ========================================================

    campaign_content = getattr(
        campaign,
        "content",
        None,
    )

    if not campaign_content:

        raise HTTPException(

            status_code=400,

            detail=
                "Original campaign content "
                "is not available.",

        )

    # ========================================================
    # CAMPAIGN TYPE
    # ========================================================

    campaign_type = (

        getattr(
            campaign,
            "campaign_type",
            None,
        )

        or
        "Public Awareness"

    )

    # ========================================================
    # CAMPAIGN SUBJECT
    # ========================================================

    campaign_subject = (

        getattr(
            campaign,
            "subject",
            None,
        )

        or
        "SmartNotify Campaign"

    )

    # ========================================================
    # OLD MESSAGE ID
    # ========================================================

    old_message_id = (
        delivery.provider_message_id
    )

    # ========================================================
    # VALIDATE RECIPIENT BEFORE STARTING RETRY
    # ========================================================
    #
    # Prevent invalid placeholder recipients such as "broadcast"
    # from reaching the SMTP provider. This keeps the delivery
    # record Failed and returns a clean 400 response.
    #
    if (
        delivery.channel
        and delivery.channel.lower() == "email"
    ):
        import re

        recipient = (
            str(delivery.recipient or "")
            .strip()
        )

        email_pattern = (
            r"^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"
        )

        if not re.match(
            email_pattern,
            recipient,
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Cannot retry email delivery "
                    f"{delivery.id}: recipient "
                    f"'{recipient or 'empty'}' is not "
                    f"a valid email address."
                ),
            )

    # ========================================================
    # START RETRY
    # ========================================================

    delivery.retry_count += 1

    delivery.status = "Retrying"

    delivery.error_message = None

    delivery.failed_at = None

    delivery.sent_at = None

    delivery.delivered_at = None

    delivery.next_retry_at = None

    db.commit()

    db.refresh(
        delivery
    )

    try:

        # ====================================================
        # WHATSAPP
        # ====================================================

        if (
            delivery.channel.lower()
            ==
            "whatsapp"
        ):

            result = send_whatsapp(
    recipient=delivery.recipient,
    content=campaign_content,
    campaign_type=campaign_type,
    campaign_name=campaign.campaign_name or "SmartNotify Campaign",
)

            new_message_id = (

                result.get(
                    "message_id"
                )

                if isinstance(
                    result,
                    dict
                )

                else None

            )

            if not new_message_id:

                raise ValueError(
                    "WhatsApp API did not "
                    "return a new message ID."
                )

            delivery.provider_message_id = (
                new_message_id
            )

            print(
                "WHATSAPP RETRY SUCCESS"
            )

            print(
                "OLD MESSAGE ID:",
                old_message_id
            )

            print(
                "NEW MESSAGE ID:",
                new_message_id
            )

        # ====================================================
        # EMAIL
        # ====================================================

        elif (
            delivery.channel.lower()
            ==
            "email"
        ):

            send_email(

                recipient=
                    delivery.recipient,

                subject=
                    campaign_subject,

                content=
                    campaign_content,

                tracking_token=
                    delivery.tracking_token,

            )

        # ====================================================
        # SMS
        # ====================================================

        elif (
            delivery.channel.lower()
            ==
            "sms"
        ):

            result = send_sms(

                recipient=
                    delivery.recipient,

                content=
                    campaign_content,

            )

            if isinstance(
                result,
                dict
            ):

                delivery.provider_message_id = (

                    result.get(
                        "message_sid"
                    )

                    or

                    result.get(
                        "sms_batch_id"
                    )

                )

        # ====================================================
        # PUSH
        # ====================================================

        elif (
            delivery.channel.lower()
            ==
            "push"
        ):

            result = send_push_notification(

                fcm_token=
                    delivery.recipient,

                title=
                    campaign_subject,

                body=
                    campaign_content,

            )

            if not result:

                raise ValueError(
                    "Firebase did not return "
                    "a message ID."
                )

            delivery.provider_message_id = (
                str(result)
            )

        # ====================================================
        # UNKNOWN CHANNEL
        # ====================================================

        else:

            raise ValueError(

                f"Retry is not implemented "
                f"for {delivery.channel}."

            )

        # ====================================================
        # SUCCESS
        # ====================================================

        delivery.status = "Sent"

        delivery.sent_at = (
            datetime.utcnow()
        )

        delivery.delivered_at = None

        delivery.failed_at = None

        delivery.error_message = None

        db.commit()

        db.refresh(
            delivery
        )

        return {

            "success":
                True,

            "delivery_id":
                delivery.id,

            "channel":
                delivery.channel,

            "status":
                delivery.status,

            "retry_count":
                delivery.retry_count,

            "provider_message_id":
                delivery.provider_message_id,

            "message":
                "Delivery retried successfully.",

        }

    # ========================================================
    # RETRY FAILURE
    # ========================================================

    except Exception as error:

        print(
            "DELIVERY RETRY FAILED:",
            delivery.id
        )

        print(
            "ERROR:",
            str(error)
        )

        delivery.status = "Failed"

        delivery.error_message = (
            str(error)
        )

        delivery.failed_at = (
            datetime.utcnow()
        )

        db.commit()

        db.refresh(
            delivery
        )

        raise HTTPException(

            status_code=502,

            detail={

                "message":
                    "Delivery retry failed.",

                "delivery_id":
                    delivery.id,

                "retry_count":
                    delivery.retry_count,

                "error":
                    str(error),

            },

        )