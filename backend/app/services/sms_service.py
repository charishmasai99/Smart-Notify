import os
import requests


TEXTBEE_URL = (
    "https://api.textbee.dev/api/v1/gateway/send-sms"
)


def send_sms(
    recipient: str,
    content: str,
):

    api_key = os.getenv("TEXTBEE_API_KEY")

    device_id = os.getenv("TEXTBEE_DEVICE_ID")

    if not api_key:
        raise ValueError(
            "TEXTBEE_API_KEY is not configured."
        )

    payload = {
        "message": content,
        "recipients": [
            recipient
        ],
    }

    if device_id:
        payload["deviceId"] = device_id

    response = requests.post(
        TEXTBEE_URL,
        headers={
            "x-api-key": api_key,
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=30,
    )

    if not response.ok:
        raise RuntimeError(
            f"TextBee API error: "
            f"{response.status_code} "
            f"{response.text}"
        )

    data = response.json()

    result = data.get("data", {})

    return {
        "message_sid": result.get(
            "smsBatchId"
        ),
        "sms_batch_id": result.get(
            "smsBatchId"
        ),
        "status": (
            "Sent"
            if result.get("success", True)
            else "Failed"
        ),
        "provider": "TextBee",
        "raw": data,
    }

# ============================================================
# TEXTBEE STATUS LOOKUP
# ============================================================

TEXTBEE_API_BASE_URL = (
    "https://api.textbee.dev/api/v1"
)


def get_sms_batch_status(
    sms_batch_id: str,
    device_id: str | None = None,
):
    """
    Fetch the current TextBee status for an SMS batch.

    TextBee documents smsBatchId as the identifier returned by
    send-sms and supports fetching the batch and its messages.
    """

    api_key = os.getenv("TEXTBEE_API_KEY")

    device_id = (
        device_id
        or os.getenv("TEXTBEE_DEVICE_ID")
    )

    if not api_key:
        raise ValueError(
            "TEXTBEE_API_KEY is not configured."
        )

    if not device_id:
        raise ValueError(
            "TEXTBEE_DEVICE_ID is not configured."
        )

    url = (
        f"{TEXTBEE_API_BASE_URL}"
        f"/gateway/devices/{device_id}"
        f"/sms-batch/{sms_batch_id}"
    )

    response = requests.get(
        url,
        headers={
            "x-api-key": api_key,
            "Accept": "application/json",
        },
        timeout=30,
    )

    if not response.ok:
        raise RuntimeError(
            f"TextBee status API error: "
            f"{response.status_code} "
            f"{response.text}"
        )

    return response.json()