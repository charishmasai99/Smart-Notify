from __future__ import annotations

import os
import secrets

from datetime import datetime
from pathlib import Path

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    WebSocket,
    WebSocketDisconnect,
)

from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database.db import get_db

from app.models.campaign import Campaign
from app.models.delivery import Delivery
from app.models.user import User

from app.services.email_service import send_email
from app.services.sms_service import send_sms
from app.services.whatsapp_service import send_whatsapp
from app.services.notification_service import send_push_notification
from app.services.broadcast_service import broadcast_manager

from app.utils.roles import (
    require_workspace_user,
    require_communication_team,
)


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/channels",
    tags=["Multi-Channel Distribution"],
)


# ============================================================
# CHANNEL LABELS
# ============================================================

CHANNEL_LABELS = {
    "email": "Email",
    "sms": "SMS",
    "whatsapp": "WhatsApp",
    "push": "Push Notification",
    "web_broadcast": "Web Broadcast",
}


# ============================================================
# REQUEST SCHEMAS
# ============================================================

class MultiChannelSendRequest(BaseModel):
    campaign_id: int

    channels: list[str] = Field(
        min_length=1
    )

    recipients: dict[str, str] = Field(
        default_factory=dict
    )

    subject: str = ""

    content: str = ""


class ChannelTestRequest(BaseModel):
    channel: str

    recipient: str = ""

    content: str = (
        "SmartNotify channel integration test"
    )

    subject: str = (
        "SmartNotify channel test"
    )


# ============================================================
# HELPERS
# ============================================================

def normalize_channel(value: str) -> str:
    """
    Convert frontend channel names into SmartNotify's
    internal channel identifiers.
    """

    channel = (
        str(value or "")
        .lower()
        .strip()
        .replace(" ", "_")
    )

    aliases = {
        "push_notification": "push",
        "web": "web_broadcast",
        "websocket": "web_broadcast",
        "broadcast": "web_broadcast",
    }

    return aliases.get(
        channel,
        channel,
    )


def _configured(channel: str) -> bool:

    if channel == "email":

        return all(
            os.getenv(key)
            for key in (
                "EMAIL_HOST",
                "EMAIL_USERNAME",
                "EMAIL_PASSWORD",
            )
        )

    if channel == "sms":

        return bool(
            os.getenv(
                "TEXTBEE_API_KEY"
            )
        )

    if channel == "whatsapp":

        return all(
            os.getenv(key)
            for key in (
                "WHATSAPP_ACCESS_TOKEN",
                "WHATSAPP_PHONE_NUMBER_ID",
                "WHATSAPP_TEMPLATE_NAME",
            )
        )

    if channel == "push":

        firebase_path = os.getenv(
            "FIREBASE_SERVICE_ACCOUNT_PATH",
            "firebase-service-account.json",
        )

        return Path(
            firebase_path
        ).exists()

    if channel == "web_broadcast":

        return True

    return False


# ============================================================
# GET AVAILABLE CHANNELS
# ============================================================

@router.get("/")
def get_channels(
    current_user: User = Depends(
        require_workspace_user
    ),
):

    return {
        "channels": [
            {
                "id": channel,
                "name": label,
                "configured": _configured(
                    channel
                ),
                "enabled": True,
            }
            for channel, label
            in CHANNEL_LABELS.items()
        ],
        "active_web_connections":
            broadcast_manager.active_connections,
    }

# ============================================================
# WEB BROADCAST WEBSOCKET
# ============================================================

@router.websocket("/websocket")
async def websocket_broadcast(
    websocket: WebSocket,
):

    try:

        # --------------------------------------------------------
        # ACCEPT AND REGISTER CONNECTION
        # --------------------------------------------------------

        await broadcast_manager.connect(
            websocket
        )

        print(
            "✅ SmartNotify Web Broadcast connected"
        )

        print(
            "Active WebSocket connections:",
            broadcast_manager.active_connections,
        )

        # --------------------------------------------------------
        # KEEP CONNECTION ALIVE
        # --------------------------------------------------------

        while True:

            try:

                message = (
                    await websocket.receive_text()
                )

                # ------------------------------------------------
                # OPTIONAL HEARTBEAT
                # ------------------------------------------------

                if message == "ping":

                    await websocket.send_text(
                        "pong"
                    )

            except WebSocketDisconnect:

                print(
                    "⚠️ SmartNotify Web Broadcast "
                    "client disconnected"
                )

                break

    except WebSocketDisconnect:

        print(
            "⚠️ SmartNotify Web Broadcast "
            "disconnected before connection completed"
        )

    except Exception as error:

        print(
            "❌ SmartNotify Web Broadcast "
            "WebSocket error:",
            error,
        )

    finally:

        # --------------------------------------------------------
        # ALWAYS REMOVE CONNECTION
        # --------------------------------------------------------

        broadcast_manager.disconnect(
            websocket
        )

        print(
            "⚠️ SmartNotify Web Broadcast disconnected"
        )

        print(
            "Active WebSocket connections:",
            broadcast_manager.active_connections,
        )

# ============================================================
# WEB BROADCAST
# ============================================================

@router.post("/web-broadcast")
async def web_broadcast(
    request: ChannelTestRequest,
    current_user: User = Depends(
        require_communication_team
    ),
):

    content = request.content.strip()

    if not content:

        raise HTTPException(
            status_code=400,
            detail="Broadcast content is required.",
        )

    delivered = await broadcast_manager.broadcast(
        {
            "type": "smartnotify_campaign",
            "title": (
                request.subject.strip()
                or "SmartNotify Campaign"
            ),
            "content": content,
            "channel": "web_broadcast",
            "timestamp": (
                datetime.utcnow()
                .isoformat()
            ),
        }
    )

    return {
        "success": True,
        "channel": "web_broadcast",
        "active_connections": delivered,
        "status": "Sent",
        "message": (
            "Web broadcast delivered "
            "to connected clients."
        ),
    }


# ============================================================
# TEST INDIVIDUAL CHANNEL
# ============================================================

@router.post("/test")
def test_channel(
    request: ChannelTestRequest,
    current_user: User = Depends(
        require_communication_team
    ),
):

    channel = normalize_channel(
        request.channel
    )

    if channel not in CHANNEL_LABELS:

        raise HTTPException(
            status_code=400,
            detail="Unsupported communication channel.",
        )

    content = request.content.strip()

    subject = (
        request.subject.strip()
        or "SmartNotify Test"
    )

    # Web broadcast does not need a recipient.

    if (
        channel != "web_broadcast"
        and not request.recipient.strip()
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                f"Recipient is required for "
                f"{CHANNEL_LABELS[channel]}."
            ),
        )

    try:

        # ----------------------------------------------------
        # EMAIL
        # ----------------------------------------------------

        if channel == "email":

            send_email(
                request.recipient.strip(),
                subject,
                content,
            )

            result = {
                "status": "Sent",
            }

        # ----------------------------------------------------
        # SMS
        # ----------------------------------------------------

        elif channel == "sms":

            result = send_sms(
                request.recipient.strip(),
                content,
            )

        # ----------------------------------------------------
        # WHATSAPP
        # ----------------------------------------------------

        elif channel == "whatsapp":

            result = send_whatsapp(
                request.recipient.strip(),
                content,
                "Channel Integration Test",
            )

        # ----------------------------------------------------
        # PUSH
        # ----------------------------------------------------

        elif channel == "push":

            message_id = send_push_notification(
                request.recipient.strip(),
                subject,
                content,
            )

            result = {
                "message_id": message_id,
                "status": "Sent",
            }

        # ----------------------------------------------------
        # WEB BROADCAST
        # ----------------------------------------------------

        else:

            delivered = (
                broadcast_manager.active_connections
            )

            result = {
                "active_connections": delivered,
                "status": "Ready",
            }

        return {
            "success": True,
            "channel": channel,
            "channel_name": CHANNEL_LABELS[channel],
            "result": result,
        }

    except Exception as error:

        raise HTTPException(
            status_code=502,
            detail=(
                f"{CHANNEL_LABELS[channel]} "
                f"test failed: {error}"
            ),
        )


# ============================================================
# MULTI-CHANNEL CAMPAIGN SEND
# ============================================================

@router.post("/send")
async def send_multi_channel(
    request: MultiChannelSendRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_communication_team
    ),
):

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
    # APPROVAL GATE
    # --------------------------------------------------------
    # Communication Team may dispatch only approved/scheduled
    # campaigns. This prevents a frontend/API bypass.

    if campaign.status not in {"Approved", "Scheduled"}:
        raise HTTPException(
            status_code=400,
            detail=(
                "Campaign must be approved before the "
                "Communication Team can send it."
            ),
        )

    # --------------------------------------------------------
    # NORMALIZE CHANNELS
    # --------------------------------------------------------

    channels = []

    for value in request.channels:

        channel = normalize_channel(value)

        if channel not in CHANNEL_LABELS:

            raise HTTPException(
                status_code=400,
                detail=(
                    f"Unsupported channel: {channel}"
                ),
            )

        if channel not in channels:

            channels.append(channel)

    if not channels:

        raise HTTPException(
            status_code=400,
            detail=(
                "At least one communication "
                "channel is required."
            ),
        )

    # --------------------------------------------------------
    # CAMPAIGN CONTENT
    # --------------------------------------------------------

    content = (
        request.content
        or campaign.content
        or ""
    ).strip()

    subject = (
        request.subject
        or campaign.subject
        or "SmartNotify Campaign"
    ).strip()

    if not content:

        raise HTTPException(
            status_code=400,
            detail="Campaign content is required.",
        )

    # --------------------------------------------------------
    # CAMPAIGN RECIPIENTS
    #
    # IMPORTANT:
    # The Campaign model stores recipients in a JSON field.
    #
    # Example:
    #
    # {
    #     "email": "charishmasai9009@gmail.com"
    # }
    #
    # The frontend may also send recipients directly.
    #
    # Priority:
    #
    # 1. request.recipients[channel]
    # 2. campaign.recipients[channel]
    #
    # --------------------------------------------------------

    campaign_recipients = (
        campaign.recipients
        if isinstance(
            campaign.recipients,
            dict
        )
        else {}
    )

    request_recipients = (
        request.recipients
        if isinstance(
            request.recipients,
            dict
        )
        else {}
    )

    # --------------------------------------------------------
    # START CAMPAIGN
    # --------------------------------------------------------

    campaign.status = "Sending"

    db.commit()

    results = []

    # ========================================================
    # SEND THROUGH EACH SELECTED CHANNEL
    # ========================================================

    for channel in channels:

        # ----------------------------------------------------
        # RESOLVE RECIPIENT
        # ----------------------------------------------------

        recipient = str(
            request_recipients.get(
                channel,
                ""
            )
            or campaign_recipients.get(
                channel,
                ""
            )
            or ""
        ).strip()

        # ----------------------------------------------------
        # WEB BROADCAST DOES NOT REQUIRE RECIPIENT
        # ----------------------------------------------------

        if channel == "web_broadcast":

            delivery_recipient = "broadcast"

        else:

            delivery_recipient = recipient

        # ----------------------------------------------------
        # CREATE DELIVERY
        # ----------------------------------------------------

        delivery = Delivery(
            campaign_id=campaign.id,
            channel=CHANNEL_LABELS[channel],
            recipient=delivery_recipient,
            status="Sending",
        )

        db.add(delivery)

        db.commit()

        db.refresh(delivery)

        try:

            provider_id = None

            # ------------------------------------------------
            # EMAIL
            # ------------------------------------------------

            if channel == "email":

                if not recipient:

                    raise ValueError(
                        "Email recipient is required."
                    )

                # Generate a unique tracking token
                # for this specific delivery.

                delivery.tracking_token = (
                    secrets.token_hex(16)
                )

                db.commit()

                db.refresh(delivery)

                # Send the email with tracking enabled.

                send_email(
                    recipient,
                    subject,
                    content,
                    tracking_token=(
                        delivery.tracking_token
                    ),
                )

            # ------------------------------------------------
            # SMS
            # ------------------------------------------------

            elif channel == "sms":

                if not recipient:

                    raise ValueError(
                        "SMS recipient is required."
                    )

                result = send_sms(
                    recipient,
                    content,
                )

                provider_id = (
                    result.get(
                        "message_sid"
                    )
                    if isinstance(
                        result,
                        dict
                    )
                    else None
                )

            # ------------------------------------------------
            # WHATSAPP
            # ------------------------------------------------

            elif channel == "whatsapp":

                if not recipient:

                    raise ValueError(
                        "WhatsApp recipient is required."
                    )

                result = send_whatsapp(
                    recipient,
                    content,
                    campaign.campaign_type
                    or "Announcement",
                )

                provider_id = (
                    result.get(
                        "message_id"
                    )
                    if isinstance(
                        result,
                        dict
                    )
                    else None
                )

            # ------------------------------------------------
            # PUSH
            # ------------------------------------------------

            elif channel == "push":

                if not recipient:

                    raise ValueError(
                        "FCM token is required "
                        "for push notification."
                    )

                provider_id = (
                    send_push_notification(
                        recipient,
                        subject,
                        content,
                    )
                )

            # ------------------------------------------------
            # WEB BROADCAST
            # ------------------------------------------------

            elif channel == "web_broadcast":

                connected_clients = (
                    await broadcast_manager.broadcast(
                        {
                            "type": "campaign",

                            "campaign_id":
                                campaign.id,

                            "campaign_name":
                                campaign.campaign_name,

                            "campaign_type":
                                (
                                    campaign.campaign_type
                                    or "Announcement"
                                ),

                            "title":
                                subject,

                            "content":
                                content,

                            "channel":
                                "web_broadcast",

                            "timestamp":
                                (
                                    datetime.utcnow()
                                    .isoformat()
                                ),
                        }
                    )
                )

                provider_id = (
                    f"WS-{campaign.id}-"
                    f"{int(datetime.utcnow().timestamp())}"
                )

                recipient = (
                    f"{connected_clients} "
                    "connected clients"
                )

                delivery.recipient = recipient

            # ------------------------------------------------
            # DELIVERY SUCCESS
            # ------------------------------------------------

            delivery.provider_message_id = (
                provider_id
            )

            delivery.status = "Sent"

            delivery.sent_at = (
                datetime.utcnow()
            )

            db.commit()

            results.append(
                {
                    "channel": channel,

                    "channel_name":
                        CHANNEL_LABELS[channel],

                    "delivery_id":
                        delivery.id,

                    "status":
                        "Sent",

                    "provider_message_id":
                        provider_id,

                    "recipient":
                        recipient,

                    "tracking_token":
                        (
                            delivery.tracking_token
                            if channel == "email"
                            else None
                        ),
                }
            )

        # ====================================================
        # DELIVERY FAILURE
        # ====================================================

        except Exception as error:

            delivery.status = "Failed"

            delivery.error_message = (
                str(error)
            )

            delivery.failed_at = (
                datetime.utcnow()
            )

            db.commit()

            results.append(
                {
                    "channel":
                        channel,

                    "channel_name":
                        CHANNEL_LABELS[channel],

                    "delivery_id":
                        delivery.id,

                    "status":
                        "Failed",

                    "error":
                        str(error),

                    "recipient":
                        recipient,
                }
            )

    # ========================================================
    # FINAL CAMPAIGN STATUS
    # ========================================================

    success_count = sum(
        item["status"] == "Sent"
        for item in results
    )

    failed_count = sum(
        item["status"] == "Failed"
        for item in results
    )

    if success_count == len(results):

        campaign.status = "Completed"

    elif success_count == 0:

        campaign.status = "Failed"

    else:

        campaign.status = "Sending"

    db.commit()

    # ========================================================
    # RESPONSE
    # ========================================================

    return {
        "success":
            success_count > 0,

        "campaign_id":
            campaign.id,

        "campaign_status":
            campaign.status,

        "channels":
            channels,

        "total_channels":
            len(results),

        "successful_channels":
            success_count,

        "failed_channels":
            failed_count,

        "results":
            results,
    }