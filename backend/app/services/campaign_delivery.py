from __future__ import annotations

from datetime import datetime, timedelta
from uuid import uuid4
from typing import Iterable

from sqlalchemy.orm import Session

from app.models.campaign import Campaign
from app.models.delivery import Delivery
from app.models.audience_member import AudienceMember
from app.models.user import User
from app.models.fcm_token import FCMToken
from app.services.broadcast_service import broadcast_manager
from app.services.email_service import send_email
from app.services.notification_service import send_push_notification
from app.services.sms_service import send_sms
from app.services.whatsapp_service import send_whatsapp


CHANNEL_LABELS = {
    "email": "Email",
    "sms": "SMS",
    "whatsapp": "WhatsApp",
    "push": "Push Notification",
    "web_broadcast": "Web Broadcast",
}


MAX_RETRIES = 3
RETRY_DELAYS_SECONDS = [60, 300, 900]


def normalize_channel(value: str) -> str:
    value = str(value or "").lower().strip().replace(" ", "_")
    return {
        "push_notification": "push",
        "web": "web_broadcast",
        "websocket": "web_broadcast",
        "broadcast": "web_broadcast",
    }.get(value, value)


def split_recipients(value: object) -> list[str]:
    """Accept one recipient, comma-separated recipients, or newline-separated recipients."""
    if value is None:
        return []
    if isinstance(value, list):
        raw_items = value
    else:
        raw_items = str(value).replace("\n", ",").split(",")
    return list(dict.fromkeys(str(item).strip() for item in raw_items if str(item).strip()))


def recipients_for_campaign(
    db: Session,
    campaign: Campaign,
    channel: str,
) -> list[str]:
    channel = normalize_channel(channel)

    # --------------------------------------------------------
    # PUSH: AUDIENCE -> USERS -> MULTIPLE FCM TOKENS
    # --------------------------------------------------------

    if channel == "push" and campaign.audience_id:

        rows = (
            db.query(FCMToken)
            .join(
                AudienceMember,
                AudienceMember.user_id == FCMToken.user_id,
            )
            .join(
                User,
                User.id == FCMToken.user_id,
            )
            .filter(
                AudienceMember.audience_id == campaign.audience_id,
                FCMToken.is_active == True,
            )
            .all()
        )

        # One FCM token per delivery.
        return list(
            dict.fromkeys(
                token.token
                for token in rows
                if token.token
            )
        )

    data = campaign.recipients or {}
    value = data.get(channel, "") if isinstance(data, dict) else ""
    recipients = split_recipients(value)

    if channel == "web_broadcast" and not recipients:
        return ["broadcast"]

    return recipients


def _send(
    channel: str,
    recipient: str,
    campaign: Campaign,
    delivery: Delivery | None = None,
) -> str | None:
    channel = normalize_channel(channel)

    if channel == "email":
        send_email(
            recipient,
            campaign.subject or "SmartNotify Campaign",
            campaign.content,
            tracking_token=(delivery.tracking_token if delivery else None),
        )
        return None

    if channel == "sms":
        result = send_sms(recipient, campaign.content)
        return result.get("message_sid") if isinstance(result, dict) else None

    if channel == "whatsapp":
        result = send_whatsapp(
    recipient,
    campaign.content,
    campaign.campaign_type or "Announcement",
    campaign.campaign_name or "SmartNotify Campaign",
)
        return result.get("message_id") if isinstance(result, dict) else None

    if channel == "push":
        return send_push_notification(recipient, campaign.subject or "SmartNotify", campaign.content)

    if channel == "web_broadcast":
        # This function is only used by the async wrapper below.
        raise RuntimeError("Web broadcast requires async delivery.")

    raise ValueError(f"Unsupported channel: {channel}")


async def deliver_campaign(db: Session, campaign: Campaign) -> dict:
    """Deliver a scheduled campaign through all configured channels and persist every attempt."""
    channels = [normalize_channel(item) for item in (campaign.channels or [])]
    channels = list(dict.fromkeys(channels))

    if not channels:
        raise ValueError("Campaign has no communication channels.")

    campaign.status = "Sending"
    db.commit()

    results: list[dict] = []

    for channel in channels:
        recipients = recipients_for_campaign(db, campaign, channel)
        if not recipients:
            results.append({
                "channel": channel,
                "status": "Failed",
                "error": f"No recipient configured for {channel}.",
            })
            continue

        for recipient in recipients:
            delivery = Delivery(
                campaign_id=campaign.id,
                channel=CHANNEL_LABELS.get(channel, channel.title()),
                recipient=recipient,
                status="Sending",
                tracking_token=uuid4().hex,
            )
            db.add(delivery)
            db.commit()
            db.refresh(delivery)

            try:
                provider_id = None

                if channel == "web_broadcast":
                    connected_clients = await broadcast_manager.broadcast({
                        "type": "campaign",
                        "campaign_id": campaign.id,
                        "campaign_name": campaign.campaign_name,
                        "campaign_type": campaign.campaign_type or "Announcement",
                        "title": campaign.subject or "SmartNotify Campaign",
                        "content": campaign.content,
                        "channel": "web_broadcast",
                        "timestamp": datetime.utcnow().isoformat(),
                    })
                    provider_id = f"WS-{campaign.id}-{int(datetime.utcnow().timestamp())}"
                    delivery.recipient = f"{connected_clients} connected clients"
                else:
                    provider_id = _send(channel, recipient, campaign, delivery)

                delivery.provider_message_id = provider_id
                delivery.status = "Sent"
                delivery.sent_at = datetime.utcnow()
                delivery.error_message = None
                delivery.next_retry_at = None
                db.commit()

                results.append({
                    "channel": channel,
                    "delivery_id": delivery.id,
                    "recipient": delivery.recipient,
                    "status": "Sent",
                    "provider_message_id": provider_id,
                })

            except Exception as error:
                delivery.status = "Failed"
                delivery.error_message = str(error)
                delivery.failed_at = datetime.utcnow()
                if delivery.retry_count < MAX_RETRIES:
                    delay = RETRY_DELAYS_SECONDS[0]
                    delivery.next_retry_at = datetime.utcnow().replace(microsecond=0) + timedelta(seconds=delay)
                else:
                    delivery.next_retry_at = None
                db.commit()

                results.append({
                    "channel": channel,
                    "delivery_id": delivery.id,
                    "recipient": delivery.recipient,
                    "status": "Failed",
                    "error": str(error),
                })

    sent = sum(item["status"] == "Sent" for item in results)
    failed = sum(item["status"] == "Failed" for item in results)

    campaign.last_run_at = datetime.utcnow()

    if sent and not failed:
        campaign.status = "Completed"
    elif sent:
        campaign.status = "Sending"
    else:
        campaign.status = "Failed"

    db.commit()
    db.refresh(campaign)

    return {
        "success": sent > 0 and failed == 0,
        "campaign_id": campaign.id,
        "campaign_status": campaign.status,
        "results": results,
    }


def refresh_campaign_after_retry(db: Session, campaign: Campaign) -> None:
    """Move a one-time campaign from Sending to Completed/Failed after retry activity."""
    if (campaign.schedule_frequency or "one_time") != "one_time":
        return

    deliveries = (
        db.query(Delivery)
        .filter(Delivery.campaign_id == campaign.id)
        .all()
    )

    if not deliveries:
        return

    active = {"Queued", "Sending", "Retrying"}
    if any(item.status in active for item in deliveries):
        campaign.status = "Sending"
        return

    if all(item.status == "Sent" for item in deliveries):
        campaign.status = "Completed"
        return

    if any(item.status == "Sent" for item in deliveries) and any(item.status == "Failed" for item in deliveries):
        # Keep Sending while a failed delivery still has retry attempts available.
        if any(item.status == "Failed" and item.retry_count < MAX_RETRIES for item in deliveries):
            campaign.status = "Sending"
        else:
            campaign.status = "Failed"
        return

    if all(item.status == "Failed" for item in deliveries):
        if any(item.retry_count < MAX_RETRIES for item in deliveries):
            campaign.status = "Sending"
        else:
            campaign.status = "Failed"



async def retry_delivery_once_async(db: Session, delivery: Delivery) -> bool:
    """Retry one failed delivery, including Web Broadcast."""
    campaign = (
        db.query(Campaign)
        .filter(Campaign.id == delivery.campaign_id)
        .first()
    )

    if not campaign:
        delivery.error_message = "Original campaign not found."
        delivery.failed_at = datetime.utcnow()
        db.commit()
        return False

    channel = normalize_channel(delivery.channel)
    delivery.retry_count += 1
    delivery.status = "Retrying"
    delivery.error_message = None
    delivery.failed_at = None
    delivery.next_retry_at = None
    db.commit()

    try:
        if channel == "web_broadcast":
            connected_clients = await broadcast_manager.broadcast({
                "type": "campaign",
                "campaign_id": campaign.id,
                "campaign_name": campaign.campaign_name,
                "campaign_type": campaign.campaign_type or "Announcement",
                "title": campaign.subject or "SmartNotify Campaign",
                "content": campaign.content,
                "channel": "web_broadcast",
                "timestamp": datetime.utcnow().isoformat(),
            })
            provider_id = f"WS-{campaign.id}-{int(datetime.utcnow().timestamp())}"
            delivery.recipient = f"{connected_clients} connected clients"
        else:
            provider_id = _send(channel, delivery.recipient, campaign, delivery)

        delivery.provider_message_id = provider_id or delivery.provider_message_id
        delivery.status = "Sent"
        delivery.sent_at = datetime.utcnow()
        delivery.delivered_at = None
        delivery.error_message = None
        refresh_campaign_after_retry(db, campaign)
        db.commit()
        return True

    except Exception as error:
        delivery.status = "Failed"
        delivery.error_message = str(error)
        delivery.failed_at = datetime.utcnow()

        if delivery.retry_count < MAX_RETRIES:
            delay = RETRY_DELAYS_SECONDS[
                min(delivery.retry_count - 1, len(RETRY_DELAYS_SECONDS) - 1)
            ]
            delivery.next_retry_at = (
                datetime.utcnow().replace(microsecond=0)
                + timedelta(seconds=delay)
            )
        else:
            delivery.next_retry_at = None

        refresh_campaign_after_retry(db, campaign)
        db.commit()
        return False


def retry_delivery_once(db: Session, delivery: Delivery) -> bool:
    """Synchronous retry helper for non-Web-Broadcast callers."""
    campaign = (
        db.query(Campaign)
        .filter(Campaign.id == delivery.campaign_id)
        .first()
    )
    if not campaign:
        delivery.error_message = "Original campaign not found."
        delivery.failed_at = datetime.utcnow()
        db.commit()
        return False

    if normalize_channel(delivery.channel) == "web_broadcast":
        delivery.error_message = "Web Broadcast retry must run in the FastAPI event loop."
        delivery.failed_at = datetime.utcnow()
        db.commit()
        return False

    channel = normalize_channel(delivery.channel)
    delivery.retry_count += 1
    delivery.status = "Retrying"
    delivery.error_message = None
    delivery.failed_at = None
    delivery.next_retry_at = None
    db.commit()

    try:
        provider_id = _send(channel, delivery.recipient, campaign, delivery)
        delivery.provider_message_id = provider_id or delivery.provider_message_id
        delivery.status = "Sent"
        delivery.sent_at = datetime.utcnow()
        delivery.delivered_at = None
        delivery.error_message = None
        refresh_campaign_after_retry(db, campaign)
        db.commit()
        return True
    except Exception as error:
        delivery.status = "Failed"
        delivery.error_message = str(error)
        delivery.failed_at = datetime.utcnow()
        if delivery.retry_count < MAX_RETRIES:
            delay = RETRY_DELAYS_SECONDS[
                min(delivery.retry_count - 1, len(RETRY_DELAYS_SECONDS) - 1)
            ]
            delivery.next_retry_at = (
                datetime.utcnow().replace(microsecond=0)
                + timedelta(seconds=delay)
            )
        else:
            delivery.next_retry_at = None
        refresh_campaign_after_retry(db, campaign)
        db.commit()
        return False
