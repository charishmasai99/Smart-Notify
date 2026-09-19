import os
import json
import hmac
import hashlib

from datetime import datetime

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    Response,
    Request,
)

from pydantic import (
    BaseModel,
    Field,
)

from sqlalchemy.orm import Session

from dotenv import load_dotenv

from app.database.db import get_db

from app.models.delivery import Delivery


# ============================================================
# ENVIRONMENT
# ============================================================

load_dotenv(
    override=True
)


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(

    prefix="/webhook",

    tags=["Webhook"],

)


# ============================================================
# VERIFY TOKEN
# ============================================================

VERIFY_TOKEN = os.getenv(

    "WHATSAPP_WEBHOOK_VERIFY_TOKEN",

    "smartnotify_webhook_token"

).strip()


# ============================================================
# TEXTBEE WEBHOOK SECRET
# ============================================================

TEXTBEE_WEBHOOK_SECRET = os.getenv(
    "TEXTBEE_WEBHOOK_SECRET",
    "",
).strip()


# ============================================================
# META WEBHOOK STATUS MODEL
# ============================================================

class WhatsAppStatus(BaseModel):

    id: str

    status: str

    timestamp: str | None = None

    recipient_id: str | None = None

    errors: list[dict] | None = None


# ============================================================
# META WEBHOOK VALUE
# ============================================================

class WhatsAppValue(BaseModel):

    messaging_product: str | None = None

    metadata: dict | None = None

    statuses: list[
        WhatsAppStatus
    ] = Field(
        default_factory=list
    )


# ============================================================
# META WEBHOOK CHANGE
# ============================================================

class WhatsAppChange(BaseModel):

    value: WhatsAppValue


# ============================================================
# META WEBHOOK ENTRY
# ============================================================

class WhatsAppEntry(BaseModel):

    changes: list[
        WhatsAppChange
    ] = Field(
        default_factory=list
    )


# ============================================================
# META WEBHOOK PAYLOAD
# ============================================================

class WhatsAppWebhookPayload(BaseModel):

    object: str | None = None

    entry: list[
        WhatsAppEntry
    ] = Field(
        default_factory=list
    )


# ============================================================
# HELPERS
# ============================================================

def _utcnow():
    return datetime.utcnow()


def _verify_textbee_signature(
    raw_body: bytes,
    signature: str | None,
) -> bool:
    """
    Verify TextBee X-Signature using HMAC-SHA256.

    TextBee signs the raw JSON request body with the webhook
    signing secret.
    """

    if not TEXTBEE_WEBHOOK_SECRET:
        return False

    if not signature:
        return False

    expected = hmac.new(
        TEXTBEE_WEBHOOK_SECRET.encode("utf-8"),
        raw_body,
        hashlib.sha256,
    ).hexdigest()

    return hmac.compare_digest(
        expected,
        signature.strip(),
    )


def _first_value(data: dict, *keys):
    for key in keys:
        value = data.get(key)
        if value not in (None, ""):
            return value
    return None


def _extract_textbee_identifiers(payload: dict) -> list[str]:
    """
    Collect possible TextBee identifiers from both the common
    top-level payload shape and nested data/message objects.
    """

    identifiers = []

    def collect(value):
        if isinstance(value, dict):
            for key in (
                "smsBatchId",
                "smsId",
                "messageId",
                "_id",
                "id",
            ):
                item = value.get(key)
                if item not in (None, ""):
                    identifiers.append(str(item))

            for child in value.values():
                if isinstance(child, (dict, list)):
                    collect(child)

        elif isinstance(value, list):
            for child in value:
                collect(child)

    collect(payload)

    return list(dict.fromkeys(identifiers))


def _extract_textbee_status(payload: dict) -> str | None:
    """
    Extract the outbound SMS status from common TextBee payload
    shapes. The webhook event name is also used as a fallback.
    """

    candidates = []

    def collect(value):
        if isinstance(value, dict):
            for key in (
                "status",
                "messageStatus",
                "deliveryStatus",
            ):
                item = value.get(key)
                if item not in (None, ""):
                    candidates.append(str(item))

            for child in value.values():
                if isinstance(child, (dict, list)):
                    collect(child)

        elif isinstance(value, list):
            for child in value:
                collect(child)

    collect(payload)

    for candidate in candidates:
        normalized = candidate.strip().lower()
        if normalized in {
            "pending",
            "dispatched",
            "sent",
            "delivered",
            "failed",
            "unknown",
        }:
            return normalized

    event = str(
        payload.get("webhookEvent")
        or payload.get("event")
        or ""
    ).strip().upper()

    return {
        "MESSAGE_SENT": "sent",
        "MESSAGE_DELIVERED": "delivered",
        "MESSAGE_FAILED": "failed",
        "SMS_STATUS_UPDATED": None,
    }.get(event)


def _extract_textbee_error(payload: dict) -> str | None:
    errors = []

    def collect(value):
        if isinstance(value, dict):
            for key in (
                "errorMessage",
                "error",
                "errorCode",
                "failureReason",
            ):
                item = value.get(key)
                if item not in (None, ""):
                    errors.append(str(item))

            for child in value.values():
                if isinstance(child, (dict, list)):
                    collect(child)

        elif isinstance(value, list):
            for child in value:
                collect(child)

    collect(payload)

    return errors[0] if errors else None


def _find_delivery(
    db: Session,
    identifiers: list[str],
):
    for identifier in identifiers:
        delivery = (
            db.query(Delivery)
            .filter(
                Delivery.provider_message_id == identifier
            )
            .first()
        )

        if delivery:
            return delivery

    return None


# ============================================================
# WEBHOOK VERIFICATION
# ============================================================

@router.get(
    "/whatsapp",
    response_class=Response,
)
def verify_whatsapp_webhook(

    hub_mode: str | None = Query(

        default=None,

        alias="hub.mode",

    ),

    hub_verify_token: str | None = Query(

        default=None,

        alias="hub.verify_token",

    ),

    hub_challenge: str | None = Query(

        default=None,

        alias="hub.challenge",

    ),

):

    print(
        "WHATSAPP WEBHOOK VERIFICATION"
    )

    print(
        "MODE:",
        hub_mode
    )

    print(
        "TOKEN MATCH:",
        hub_verify_token == VERIFY_TOKEN
    )

    if (

        hub_mode == "subscribe"

        and

        hub_verify_token == VERIFY_TOKEN

    ):

        print(
            "WHATSAPP WEBHOOK VERIFIED"
        )

        return Response(

            content=
                hub_challenge or "",

            media_type=
                "text/plain",

            status_code=
                200,

        )

    print(
        "WHATSAPP WEBHOOK VERIFICATION FAILED"
    )

    return Response(

        content=
            "Verification failed",

        media_type=
            "text/plain",

        status_code=
            403,

    )


# ============================================================
# WHATSAPP WEBHOOK
# ============================================================

@router.post(
    "/whatsapp"
)
def whatsapp_webhook(

    payload:
        WhatsAppWebhookPayload,

    db:
        Session = Depends(
            get_db
        ),

):

    processed = 0
    ignored = 0

    try:

        if (
            payload.object
            and
            payload.object != "whatsapp_business_account"
        ):

            print(
                "UNEXPECTED WEBHOOK OBJECT:",
                payload.object
            )

        for entry in payload.entry:

            for change in entry.changes:

                statuses = change.value.statuses

                if not statuses:
                    continue

                for status in statuses:

                    provider_message_id = status.id

                    whatsapp_status = (
                        status.status
                        .strip()
                        .lower()
                    )

                    print(
                        "--------------------------------"
                    )

                    print(
                        "WHATSAPP WEBHOOK STATUS:",
                        whatsapp_status
                    )

                    print(
                        "PROVIDER MESSAGE ID:",
                        provider_message_id
                    )

                    delivery = (
                        db.query(Delivery)
                        .filter(
                            Delivery.provider_message_id
                            == provider_message_id
                        )
                        .first()
                    )

                    if not delivery:

                        print(
                            "DELIVERY NOT FOUND:",
                            provider_message_id
                        )

                        ignored += 1
                        continue

                    now = _utcnow()

                    if whatsapp_status == "sent":

                        delivery.status = "Sent"

                        if not delivery.sent_at:
                            delivery.sent_at = now

                    elif whatsapp_status == "delivered":

                        delivery.status = "Delivered"

                        if not delivery.sent_at:
                            delivery.sent_at = now

                        if not delivery.delivered_at:
                            delivery.delivered_at = now

                        delivery.failed_at = None
                        delivery.error_message = None

                    elif whatsapp_status == "read":

                        delivery.status = "Read"

                        if not delivery.sent_at:
                            delivery.sent_at = now

                        if not delivery.delivered_at:
                            delivery.delivered_at = now

                        delivery.failed_at = None
                        delivery.error_message = None

                    elif whatsapp_status == "failed":

                        delivery.status = "Failed"
                        delivery.failed_at = now

                        if status.errors:
                            delivery.error_message = str(
                                status.errors
                            )

                    else:

                        print(
                            "UNKNOWN WHATSAPP STATUS:",
                            whatsapp_status
                        )

                        ignored += 1
                        continue

                    processed += 1

        db.commit()

        print(
            "WHATSAPP WEBHOOK COMPLETE"
        )

        print(
            "PROCESSED:",
            processed
        )

        print(
            "IGNORED:",
            ignored
        )

        return {
            "success": True,
            "processed": processed,
            "ignored": ignored,
            "message": "WhatsApp webhook processed successfully.",
        }

    except Exception as error:

        db.rollback()

        print(
            "WHATSAPP WEBHOOK ERROR:",
            str(error)
        )

        raise HTTPException(
            status_code=500,
            detail=
                "Webhook processing failed: "
                f"{str(error)}",
        )


# ============================================================
# TEXTBEE SMS WEBHOOK
# ============================================================

@router.post(
    "/textbee",
)
async def textbee_webhook(
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Receive TextBee outbound SMS status events.

    TextBee sends an HMAC-SHA256 signature in X-Signature.
    The raw request body is verified before JSON parsing.
    """

    raw_body = await request.body()

    signature = request.headers.get(
        "X-Signature"
    )

    if not _verify_textbee_signature(
        raw_body,
        signature,
    ):

        print(
            "TEXTBEE WEBHOOK SIGNATURE INVALID"
        )

        raise HTTPException(
            status_code=401,
            detail="Invalid TextBee webhook signature.",
        )

    try:
        payload = json.loads(
            raw_body.decode("utf-8")
        )
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid JSON payload.",
        )

    if not isinstance(payload, dict):
        raise HTTPException(
            status_code=400,
            detail="TextBee payload must be a JSON object.",
        )

    event = str(
        payload.get("webhookEvent")
        or payload.get("event")
        or ""
    ).strip().upper()

    identifiers = _extract_textbee_identifiers(
        payload
    )

    status = _extract_textbee_status(
        payload
    )

    error_message = _extract_textbee_error(
        payload
    )

    print(
        "========================================"
    )

    print(
        "TEXTBEE WEBHOOK RECEIVED"
    )

    print(
        "EVENT:",
        event
    )

    print(
        "IDENTIFIERS:",
        identifiers
    )

    print(
        "STATUS:",
        status
    )

    delivery = _find_delivery(
        db,
        identifiers,
    )

    if not delivery:

        print(
            "TEXTBEE DELIVERY NOT FOUND",
            identifiers,
        )

        return {
            "success": True,
            "processed": 0,
            "ignored": 1,
            "message": "Webhook accepted; matching delivery not found.",
        }

    now = _utcnow()

    # --------------------------------------------------------
    # SENT
    # --------------------------------------------------------

    if status == "sent" or event == "MESSAGE_SENT":

        delivery.status = "Sent"

        if not delivery.sent_at:
            delivery.sent_at = now

        delivery.failed_at = None
        delivery.error_message = None

    # --------------------------------------------------------
    # DELIVERED
    # --------------------------------------------------------

    elif status == "delivered" or event == "MESSAGE_DELIVERED":

        delivery.status = "Delivered"

        if not delivery.sent_at:
            delivery.sent_at = now

        delivery.delivered_at = now
        delivery.failed_at = None
        delivery.error_message = None

    # --------------------------------------------------------
    # FAILED
    # --------------------------------------------------------

    elif status == "failed" or event == "MESSAGE_FAILED":

        delivery.status = "Failed"
        delivery.failed_at = now
        delivery.error_message = (
            error_message
            or "TextBee reported SMS delivery failure."
        )

    # --------------------------------------------------------
    # OTHER / UNKNOWN
    # --------------------------------------------------------

    else:

        print(
            "TEXTBEE EVENT NOT MAPPED:",
            event,
            status,
        )

        return {
            "success": True,
            "processed": 0,
            "ignored": 1,
            "message": "TextBee event acknowledged but not mapped.",
        }

    db.commit()
    db.refresh(delivery)

    print(
        "TEXTBEE DELIVERY UPDATED:",
        delivery.id,
        "→",
        delivery.status,
    )

    return {
        "success": True,
        "processed": 1,
        "delivery_id": delivery.id,
        "status": delivery.status,
        "retry_count": delivery.retry_count,
        "provider_message_id": delivery.provider_message_id,
    }