from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from sqlalchemy.orm import Session

from sqlalchemy.exc import IntegrityError

from app.database.db import get_db

from app.models.user import User
from app.models.notification import Notification
from app.models.fcm_token import FCMToken

from app.schemas.notification import (
    FCMTokenRequest,
    NotificationResponse,
)

from app.utils.auth import get_current_user

from app.services.notification_service import (
    send_push_notification,
)


router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"],
)


# ============================================================
# REGISTER FCM TOKEN
# ============================================================

@router.post("/register-token")
def register_fcm_token(
    data: FCMTokenRequest,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):

    token = data.token.strip()

    if not token:
        raise HTTPException(
            status_code=400,
            detail="FCM token is required",
        )

    # --------------------------------------------------------
    # FIND EXISTING TOKEN FOR THIS USER
    # --------------------------------------------------------

    existing_token = (
        db.query(FCMToken)
        .filter(
            FCMToken.user_id == current_user.id,
            FCMToken.token == token,
        )
        .first()
    )

    # --------------------------------------------------------
    # TOKEN ALREADY EXISTS
    # --------------------------------------------------------

    if existing_token:

        existing_token.is_active = True

        db.commit()

        return {
            "message": (
                "FCM token registered successfully"
            ),
            "user_id": current_user.id,
            "multiple_tokens_supported": True,
            "token_reused": True,
        }

    # --------------------------------------------------------
    # TOKEN DOES NOT EXIST
    # --------------------------------------------------------

    new_token = FCMToken(
        user_id=current_user.id,
        token=token,
        is_active=True,
    )

    db.add(new_token)

    try:

        db.commit()

    except IntegrityError:

        # ----------------------------------------------------
        # RACE CONDITION PROTECTION
        #
        # The frontend can call token registration more than
        # once at almost the same time.
        #
        # One request may insert the token while another
        # request is already trying to insert the same token.
        #
        # The unique database constraint correctly rejects
        # the second INSERT.
        #
        # Roll back and fetch the record that now exists.
        # ----------------------------------------------------

        db.rollback()

        existing_token = (
            db.query(FCMToken)
            .filter(
                FCMToken.user_id == current_user.id,
                FCMToken.token == token,
            )
            .first()
        )

        if existing_token:

            existing_token.is_active = True

            db.commit()

            # ----------------------------------------------
            # KEEP LEGACY USER TOKEN IN SYNC
            # ----------------------------------------------

            current_user.fcm_token = token

            db.commit()

            return {
                "message": (
                    "FCM token registered successfully"
                ),
                "user_id": current_user.id,
                "multiple_tokens_supported": True,
                "token_reused": True,
            }

        # ----------------------------------------------------
        # IF THE TOKEN STILL CANNOT BE FOUND, SOMETHING ELSE
        # CAUSED THE DATABASE CONFLICT.
        # ----------------------------------------------------

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to register FCM token."
            ),
        )

    # --------------------------------------------------------
    # KEEP LEGACY USER TOKEN IN SYNC
    # --------------------------------------------------------

    current_user.fcm_token = token

    db.commit()

    return {
        "message": (
            "FCM token registered successfully"
        ),
        "user_id": current_user.id,
        "multiple_tokens_supported": True,
        "token_reused": False,
    }


# ============================================================
# TEST PUSH NOTIFICATION
# ============================================================

@router.post("/test")
def test_notification(
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):

    if not current_user.fcm_token:
        raise HTTPException(
            status_code=400,
            detail=(
                "No FCM token registered "
                "for this user."
            ),
        )

    title = "AI Mass Communication"

    message = (
        "This is a test notification "
        "from your communication platform."
    )

    try:

        # ----------------------------------------------------
        # Save notification in database
        # ----------------------------------------------------

        notification = Notification(
            user_id=current_user.id,
            title=title,
            message=message,
            is_read=False,
        )

        db.add(notification)
        db.commit()
        db.refresh(notification)

        # ----------------------------------------------------
        # Send browser push notification
        # ----------------------------------------------------

        message_id = send_push_notification(
            fcm_token=current_user.fcm_token,
            title=title,
            body=message,
        )

        return {
            "message": (
                "Push notification sent successfully"
            ),
            "message_id": message_id,
            "notification_id": notification.id,
        }

    except Exception as error:

        db.rollback()

        print(
            "FCM notification error:",
            error,
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to send push notification."
            ),
        )


# ============================================================
# GET MY NOTIFICATIONS
# ============================================================

@router.get(
    "/",
    response_model=list[NotificationResponse],
)
def get_notifications(
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):

    notifications = (
        db.query(Notification)
        .filter(
            Notification.user_id
            == current_user.id
        )
        .order_by(
            Notification.created_at.desc()
        )
        .all()
    )

    return notifications


# ============================================================
# GET UNREAD COUNT
# ============================================================

@router.get("/unread-count")
def get_unread_count(
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):

    count = (
        db.query(Notification)
        .filter(
            Notification.user_id
            == current_user.id,
            Notification.is_read == False,
        )
        .count()
    )

    return {
        "count": count
    }


# ============================================================
# MARK ONE NOTIFICATION AS READ
# ============================================================

@router.put(
    "/{notification_id}/read"
)
def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):

    notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.user_id
            == current_user.id,
        )
        .first()
    )

    if not notification:
        raise HTTPException(
            status_code=404,
            detail="Notification not found",
        )

    notification.is_read = True

    db.commit()
    db.refresh(notification)

    return {
        "message": (
            "Notification marked as read"
        )
    }


# ============================================================
# MARK ALL NOTIFICATIONS AS READ
# ============================================================

@router.put("/read-all")
def mark_all_notifications_read(
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):

    (
        db.query(Notification)
        .filter(
            Notification.user_id
            == current_user.id,
            Notification.is_read == False,
        )
        .update(
            {
                Notification.is_read: True
            }
        )
    )

    db.commit()

    return {
        "message": (
            "All notifications marked as read"
        )
    }