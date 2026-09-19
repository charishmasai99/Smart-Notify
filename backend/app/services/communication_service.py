from datetime import datetime


SUPPORTED_CHANNELS = {
    "email",
    "sms",
    "whatsapp",
    "push",
    "web_broadcast",
}


def normalize_channel(channel: str) -> str:
    value = str(channel or "").lower().strip().replace(" ", "_")
    aliases = {
        "push_notification": "push",
        "web": "web_broadcast",
        "websocket": "web_broadcast",
    }
    return aliases.get(value, value)


def validate_channels(channels: list[str]) -> list[str]:
    normalized = []
    for channel in channels:
        value = normalize_channel(channel)
        if value not in SUPPORTED_CHANNELS:
            raise ValueError(
                f"Unsupported channel: {channel}. Supported channels: "
                f"{', '.join(sorted(SUPPORTED_CHANNELS))}."
            )
        if value not in normalized:
            normalized.append(value)
    if not normalized:
        raise ValueError("At least one communication channel is required.")
    return normalized


def simulate_communication(channel: str, recipient: str, content: str, subject: str = "") -> dict:
    channel = normalize_channel(channel)
    validate_channels([channel])
    if channel != "web_broadcast" and not recipient.strip():
        raise ValueError("Recipient is required.")
    if not content.strip():
        raise ValueError("Message content is required.")

    message_id = f"SIM-{channel.upper()}-{int(datetime.now().timestamp())}"
    return {
        "message_id": message_id,
        "channel": channel,
        "recipient": recipient,
        "subject": subject if channel == "email" else None,
        "content": content,
        "status": "SIMULATED",
        "message": f"{channel.replace('_', ' ').title()} message simulated successfully.",
        "timestamp": datetime.now().isoformat(),
    }
