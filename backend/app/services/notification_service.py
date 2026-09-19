from firebase_admin import messaging

from app.services.firebase_service import (
    initialize_firebase,
)


# ============================================================
# SEND PUSH NOTIFICATION
# ============================================================

def send_push_notification(
    fcm_token: str,
    title: str,
    body: str,
):
    """
    Send a push notification to one browser/device.

    Parameters
    ----------
    fcm_token:
        Firebase Cloud Messaging registration token.

    title:
        Notification title.

    body:
        Notification body.

    Returns
    -------
    str
        Firebase message ID returned by Firebase Admin SDK.
    """

    # ========================================================
    # VALIDATION
    # ========================================================

    if not fcm_token:

        raise ValueError(
            "FCM token is missing."
        )

    if not title:

        raise ValueError(
            "Push notification title is required."
        )

    if not body:

        raise ValueError(
            "Push notification body is required."
        )


    # ========================================================
    # INITIALIZE FIREBASE
    # ========================================================

    initialize_firebase()


    # ========================================================
    # CREATE FCM MESSAGE
    # ========================================================

    message = messaging.Message(

        notification=messaging.Notification(

            title=title,

            body=body,

        ),

        token=fcm_token,

    )


    # ========================================================
    # SEND
    # ========================================================

    try:

        response = messaging.send(
            message
        )

    except Exception as error:

        print(
            "FCM SEND ERROR:",
            str(error)
        )

        raise ValueError(
            f"FCM notification failed: {error}"
        )


    # ========================================================
    # DEBUG
    # ========================================================

    print(
        "FCM PUSH SENT:",
        response
    )


    # ========================================================
    # RETURN
    # ========================================================

    return response
