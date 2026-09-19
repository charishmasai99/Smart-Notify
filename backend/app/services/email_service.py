from __future__ import annotations

import html

import os

import re

import smtplib

from email.message import EmailMessage

from urllib.parse import quote

from dotenv import load_dotenv


# ============================================================
# LOAD ENVIRONMENT VARIABLES
# ============================================================

load_dotenv(
    override=True
)


# ============================================================
# URL PATTERN
# ============================================================

_URL_PATTERN = re.compile(
    r"(?<![\"'=])(https?://[^\s<]+)",
    re.IGNORECASE,
)


# ============================================================
# TRACKING BASE URL
# ============================================================

def _tracking_base_url() -> str:

    return os.getenv(
        "PUBLIC_BASE_URL",
        "http://127.0.0.1:8000",
    ).rstrip("/")


# ============================================================
# FRONTEND BASE URL
# ============================================================

def _frontend_base_url() -> str:

    return os.getenv(
        "FRONTEND_URL",
        "http://localhost:5173",
    ).rstrip("/")


# ============================================================
# FEEDBACK URL
# ============================================================

def _build_feedback_url(
    tracking_token: str,
) -> str:

    frontend = _frontend_base_url()

    return (
        f"{frontend}/feedback-auth"
        f"?token={tracking_token}"
    )


# ============================================================
# PASSWORD RESET URL
# ============================================================

def _build_password_reset_url(
    reset_token: str,
) -> str:

    frontend = _frontend_base_url()

    return (
        f"{frontend}/reset-password"
        f"?token={quote(reset_token, safe='')}"
    )


# ============================================================
# TRACKED HTML
# ============================================================

def _build_tracked_html(
    content: str,
    tracking_token: str | None,
) -> str:

    escaped = html.escape(
        content
    ).replace(
        "\n",
        "<br>",
    )

    if not tracking_token:

        return (
            "<html>"
            "<body>"
            f"<div>{escaped}</div>"
            "</body>"
            "</html>"
        )

    base = _tracking_base_url()

    # ========================================================
    # CLICK TRACKING
    # ========================================================

    def replace_url(
        match: re.Match,
    ) -> str:

        original_url = match.group(1)

        url = original_url.rstrip(
            ".,);]}"
        )

        trailing = original_url[
            len(url):
        ]

        tracked = (
            f"{base}/tracking/click/"
            f"{tracking_token}"
            f"?url={quote(url, safe='')}"
        )

        return tracked + trailing

    escaped = _URL_PATTERN.sub(
        replace_url,
        escaped,
    )

    # ========================================================
    # OPEN TRACKING PIXEL
    # ========================================================

    pixel = (
        f'<img src="{base}/tracking/open/'
        f'{tracking_token}" '
        'width="1" '
        'height="1" '
        'alt="" '
        'style="display:none;'
        'width:1px;'
        'height:1px;'
        'border:0;" />'
    )

    # ========================================================
    # FEEDBACK BUTTON
    # ========================================================

    feedback_url = _build_feedback_url(
        tracking_token
    )

    feedback_button = f"""
        <div style="
            margin-top:32px;
            padding-top:24px;
            border-top:1px solid #e5e7eb;
            text-align:center;
        ">

            <p style="
                margin:0 0 14px 0;
                font-family:Arial,sans-serif;
                font-size:14px;
                color:#64748b;
            ">
                We'd love to hear from you.
            </p>

            <a
                href="{html.escape(feedback_url, quote=True)}"
                style="
                    display:inline-block;
                    padding:12px 22px;
                    background:#07152f;
                    color:#ffffff;
                    text-decoration:none;
                    border-radius:8px;
                    font-family:Arial,sans-serif;
                    font-size:14px;
                    font-weight:600;
                "
            >
                Give Feedback
            </a>

        </div>
    """

    return (
        "<!doctype html>"
        "<html>"
        "<body style="
        "\"margin:0;"
        "padding:20px;"
        "background:#f8fafc;\""
        ">"

        f"""
        <div style="
            max-width:640px;
            margin:0 auto;
            background:#ffffff;
            padding:24px;
            border-radius:12px;
            font-family:Arial,sans-serif;
            line-height:1.5;
            color:#0f172a;
        ">

            <div>
                {escaped}
            </div>

            {feedback_button}

        </div>
        """

        f"{pixel}"

        "</body>"
        "</html>"
    )


# ============================================================
# PASSWORD RESET EMAIL HTML
# ============================================================

def _build_password_reset_html(
    recipient_name: str,
    reset_url: str,
) -> str:

    safe_name = html.escape(
        recipient_name or "there"
    )

    safe_url = html.escape(
        reset_url,
        quote=True,
    )

    return f"""
<!doctype html>

<html>

<body style="
    margin:0;
    padding:0;
    background:#f8fafc;
    font-family:Arial,sans-serif;
">

    <div style="
        max-width:600px;
        margin:40px auto;
        background:#ffffff;
        border-radius:14px;
        padding:36px;
        border:1px solid #e5e7eb;
    ">

        <div style="
            text-align:center;
            margin-bottom:28px;
        ">

            <div style="
                display:inline-block;
                width:52px;
                height:52px;
                line-height:52px;
                border-radius:14px;
                background:#07152f;
                color:#ffffff;
                font-size:24px;
                font-weight:bold;
            ">
                S
            </div>

        </div>

        <h2 style="
            margin:0 0 18px 0;
            color:#07152f;
            font-size:24px;
            text-align:center;
        ">
            Reset your SmartNotify password
        </h2>

        <p style="
            margin:0 0 16px 0;
            color:#334155;
            font-size:15px;
            line-height:1.6;
        ">
            Hi {safe_name},
        </p>

        <p style="
            margin:0 0 24px 0;
            color:#475569;
            font-size:15px;
            line-height:1.6;
        ">
            We received a request to reset the password
            for your SmartNotify account.
        </p>

        <div style="
            text-align:center;
            margin:30px 0;
        ">

            <a
                href="{safe_url}"
                style="
                    display:inline-block;
                    padding:14px 28px;
                    background:#07152f;
                    color:#ffffff;
                    text-decoration:none;
                    border-radius:8px;
                    font-size:15px;
                    font-weight:600;
                "
            >
                Reset Password
            </a>

        </div>

        <p style="
            margin:0 0 12px 0;
            color:#64748b;
            font-size:13px;
            line-height:1.6;
        ">
            This link expires in 30 minutes.
        </p>

        <p style="
            margin:0;
            color:#64748b;
            font-size:13px;
            line-height:1.6;
        ">
            If you did not request a password reset,
            you can safely ignore this email.
        </p>

        <hr style="
            margin:28px 0;
            border:0;
            border-top:1px solid #e5e7eb;
        ">

        <p style="
            margin:0;
            color:#94a3b8;
            font-size:12px;
            line-height:1.5;
            word-break:break-all;
        ">
            If the button does not work, copy and paste
            this link into your browser:
            <br><br>
            {safe_url}
        </p>

    </div>

</body>

</html>
"""


# ============================================================
# SEND PASSWORD RESET EMAIL
# ============================================================

def send_password_reset_email(
    recipient: str,
    recipient_name: str,
    reset_token: str,
):

    email_host = os.getenv(
        "EMAIL_HOST"
    )

    email_port = int(
        os.getenv(
            "EMAIL_PORT",
            "587",
        )
    )

    email_username = os.getenv(
        "EMAIL_USERNAME"
    )

    email_password = os.getenv(
        "EMAIL_PASSWORD"
    )

    # ========================================================
    # VALIDATE SMTP
    # ========================================================

    if not email_host:

        raise ValueError(
            "EMAIL_HOST is not configured"
        )

    if not email_username:

        raise ValueError(
            "EMAIL_USERNAME is not configured"
        )

    if not email_password:

        raise ValueError(
            "EMAIL_PASSWORD is not configured"
        )

    # ========================================================
    # RESET URL
    # ========================================================

    reset_url = _build_password_reset_url(
        reset_token
    )

    # ========================================================
    # MESSAGE
    # ========================================================

    message = EmailMessage()

    message["From"] = email_username

    message["To"] = recipient

    message["Subject"] = (
        "Reset your SmartNotify password"
    )

    # ========================================================
    # TEXT VERSION
    # ========================================================

    message.set_content(
        f"""
Hi {recipient_name or "there"},

We received a request to reset your SmartNotify password.

Reset your password using this link:

{reset_url}

This link expires in 30 minutes.

If you did not request a password reset, you can safely ignore this email.

SmartNotify
""".strip()
    )

    # ========================================================
    # HTML VERSION
    # ========================================================

    message.add_alternative(
        _build_password_reset_html(
            recipient_name,
            reset_url,
        ),
        subtype="html",
    )

    # ========================================================
    # SEND
    # ========================================================

    with smtplib.SMTP(
        email_host,
        email_port,
    ) as server:

        server.starttls()

        server.login(
            email_username,
            email_password,
        )

        server.send_message(
            message
        )

    return True


# ============================================================
# NORMAL EMAIL
# ============================================================

def send_email(
    recipient: str,
    subject: str,
    content: str,
    tracking_token: str | None = None,
):

    email_host = os.getenv(
        "EMAIL_HOST"
    )

    email_port = int(
        os.getenv(
            "EMAIL_PORT",
            "587",
        )
    )

    email_username = os.getenv(
        "EMAIL_USERNAME"
    )

    email_password = os.getenv(
        "EMAIL_PASSWORD"
    )

    if not email_host:

        raise ValueError(
            "EMAIL_HOST is not configured"
        )

    if not email_username:

        raise ValueError(
            "EMAIL_USERNAME is not configured"
        )

    if not email_password:

        raise ValueError(
            "EMAIL_PASSWORD is not configured"
        )

    message = EmailMessage()

    message["From"] = email_username

    message["To"] = recipient

    message["Subject"] = subject

    message.set_content(
        content
    )

    if tracking_token:

        message.add_alternative(
            _build_tracked_html(
                content,
                tracking_token,
            ),
            subtype="html",
        )

    with smtplib.SMTP(
        email_host,
        email_port,
    ) as server:

        server.starttls()

        server.login(
            email_username,
            email_password,
        )

        server.send_message(
            message
        )

    return True