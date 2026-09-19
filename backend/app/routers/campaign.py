from datetime import datetime

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.database.db import get_db

from app.models.campaign import Campaign
from app.models.user import User
from app.models.notification import Notification
from app.models.delivery import Delivery
from app.models.feedback import Feedback
from app.models.audience_member import AudienceMember
from app.models.fcm_token import FCMToken

from app.schemas.campaign import (
    CampaignCreate,
    CampaignUpdate,
    CampaignResponse,
)

from app.utils.roles import (
    require_workspace_user,
    require_campaign_manager,
    require_communication_team,
    require_admin,
)


from app.services.notification_service import (
    send_push_notification,
)

from app.schemas.campaign import VALID_FREQUENCIES


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/campaign",
    tags=["Campaign"],
)


# ============================================================
# VALID CAMPAIGN CHANNELS
# ============================================================

VALID_CHANNELS = [
    "email",
    "sms",
    "whatsapp",
    "push",
    "web_broadcast",
]


# ============================================================
# VALID CAMPAIGN STATUSES
# ============================================================

VALID_STATUS = [
    "Draft",
    "Pending Review",
    "Approved",
    "Scheduled",
    "Sending",
    "Completed",
    "Failed",
    "Rejected",
]


# ============================================================
# CAMPAIGN WORKFLOW
# ============================================================
#
# NOTE:
# This dictionary is kept for reference/documentation.
#
# Status changes are NOT restricted by this workflow.
# The user can manually change a campaign from any valid
# status to any other valid status.
#
# ============================================================

WORKFLOW = {

    "Draft": [
        "Pending Review",
        "Approved",
        "Rejected",
        "Scheduled",
        "Sending",
        "Completed",
        "Failed",
    ],

    "Pending Review": [
        "Draft",
        "Approved",
        "Rejected",
        "Scheduled",
        "Sending",
        "Completed",
        "Failed",
    ],

    "Approved": [
        "Draft",
        "Pending Review",
        "Rejected",
        "Scheduled",
        "Sending",
        "Completed",
        "Failed",
    ],

    "Scheduled": [
        "Draft",
        "Pending Review",
        "Approved",
        "Rejected",
        "Sending",
        "Completed",
        "Failed",
    ],

    "Sending": [
        "Draft",
        "Pending Review",
        "Approved",
        "Scheduled",
        "Completed",
        "Failed",
        "Rejected",
    ],

    "Completed": [
        "Draft",
        "Pending Review",
        "Approved",
        "Scheduled",
        "Sending",
        "Failed",
        "Rejected",
    ],

    "Failed": [
        "Draft",
        "Pending Review",
        "Approved",
        "Scheduled",
        "Sending",
        "Completed",
        "Rejected",
    ],

    "Rejected": [
        "Draft",
        "Pending Review",
        "Approved",
        "Scheduled",
        "Sending",
        "Completed",
        "Failed",
    ],

}


# ============================================================
# SCHEDULING VALIDATION
# ============================================================

def validate_schedule_payload(
    status: str,
    schedule_time,
    schedule_frequency: str,
    channels: list[str],
    recipients: dict[str, str],
    audience_id: int | None = None,
):

    if schedule_frequency not in VALID_FREQUENCIES:

        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid schedule frequency. "
                "Use one_time, daily, weekly or monthly."
            ),
        )


    if status != "Scheduled":
        return


    if schedule_time is None:

        raise HTTPException(
            status_code=400,
            detail=(
                "A schedule time is required "
                "for a scheduled campaign."
            ),
        )


    recipients = recipients or {}

    missing = []


    for channel in channels:

        if channel == "web_broadcast":
            continue


        # Push campaigns can resolve recipients
        # from the selected audience.

        if channel == "push" and audience_id is not None:
            continue


        value = recipients.get(channel)


        if not str(value or "").strip():

            missing.append(channel)


    if missing:

        raise HTTPException(
            status_code=400,
            detail=(
                "Recipient is required for "
                "scheduled channel(s): "
                + ", ".join(missing)
            ),
        )


# ============================================================
# CREATE CAMPAIGN NOTIFICATION
# ============================================================

def create_campaign_notification(
    db: Session,
    user: User,
    title: str,
    message: str,
):

    """
    Save notification in PostgreSQL
    and send an FCM browser notification.
    """

    notification = Notification(

        user_id=user.id,

        title=title,

        message=message,

        is_read=False,

    )


    db.add(notification)

    db.commit()

    db.refresh(notification)


    # ========================================================
    # SEND BROWSER PUSH
    # ========================================================

    if user.fcm_token:

        try:

            message_id = send_push_notification(

                fcm_token=user.fcm_token,

                title=title,

                body=message,

            )


            print(
                "CAMPAIGN FCM SENT:",
                message_id,
            )


        except Exception as error:

            print(
                "CAMPAIGN FCM ERROR:",
                error,
            )


    else:

        print(
            "NO FCM TOKEN FOR USER:",
            user.id,
        )


    return notification


# ============================================================
# CREATE CAMPAIGN
# ============================================================

@router.post(
    "/",
    response_model=CampaignResponse,
)
def create_campaign(

    campaign: CampaignCreate,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
    require_campaign_manager
),

):

    try:

        # ====================================================
        # VALIDATE STATUS
        # ====================================================

        if campaign.status not in VALID_STATUS:

            raise HTTPException(
                status_code=400,
                detail="Invalid campaign status.",
            )

        if campaign.status not in {"Draft", "Pending Review"}:
            raise HTTPException(
                status_code=403,
                detail=(
                    "Campaign Manager can only create campaigns "
                    "as Draft or Pending Review."
                ),
            )


        # ====================================================
        # VALIDATE CHANNELS
        # ====================================================

        channels = [

            str(item)
            .lower()
            .strip()

            for item in campaign.channels

            if str(item).strip()

        ]


        channels = list(
            dict.fromkeys(
                channels
            )
        )


        if not channels:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Select at least one "
                    "communication channel."
                ),
            )


        invalid_channels = [

            item

            for item in channels

            if item not in VALID_CHANNELS

        ]


        if invalid_channels:

            raise HTTPException(

                status_code=400,

                detail=(
                    "Unsupported channel(s): "
                    + ", ".join(
                        invalid_channels
                    )
                ),

            )


        # ====================================================
        # RECIPIENTS
        # ====================================================

        recipients = (
            campaign.recipients
            or {}
        )


        validate_schedule_payload(

            campaign.status,

            campaign.schedule_time,

            campaign.schedule_frequency,

            channels,

            recipients,

            campaign.audience_id,

        )


        # ====================================================
        # CREATE CAMPAIGN
        # ====================================================

        new_campaign = Campaign(

            campaign_name=
                campaign.campaign_name,

            campaign_type=
                campaign.campaign_type,

            subject=
                campaign.subject,

            content=
                campaign.content,

            channels=
                channels,

            audience_id=
                campaign.audience_id,

            schedule_time=
                campaign.schedule_time,

            schedule_frequency=
                campaign.schedule_frequency,

            recipients=
                recipients,

            next_run_at=(

                campaign.schedule_time

                if campaign.status
                == "Scheduled"

                else None

            ),

            status=
                campaign.status,

        )


        db.add(
            new_campaign
        )

        db.commit()

        db.refresh(
            new_campaign
        )


        # ====================================================
        # NOTIFICATION
        # ====================================================

        create_campaign_notification(

            db=db,

            user=current_user,

            title="Campaign Created",

            message=(

                f'Your campaign '
                f'"{new_campaign.campaign_name}" '
                f'was created successfully.'

            ),

        )


        return new_campaign


    except HTTPException:

        raise


    except SQLAlchemyError as error:

        db.rollback()

        print(
            "DATABASE ERROR:",
            error,
        )

        raise HTTPException(

            status_code=500,

            detail=(
                f"Database error: "
                f"{str(error)}"
            ),

        )


    except Exception as error:

        db.rollback()

        print(
            "CAMPAIGN CREATE ERROR:",
            error,
        )

        raise HTTPException(

            status_code=500,

            detail=(
                f"Campaign creation failed: "
                f"{str(error)}"
            ),

        )


# ============================================================
# SEND PUSH CAMPAIGN
# ============================================================

@router.post(
    "/{campaign_id}/send",
)
def send_campaign(

    campaign_id: int,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        require_communication_team
    ),

):

    # ========================================================
    # FIND CAMPAIGN
    # ========================================================

    campaign = (

        db.query(
            Campaign
        )

        .filter(
            Campaign.id
            ==
            campaign_id
        )

        .first()

    )


    if not campaign:

        raise HTTPException(

            status_code=404,

            detail="Campaign not found.",

        )


    # ========================================================
    # ONLY PUSH FOR THIS FIRST IMPLEMENTATION
    # ========================================================

    channels = [

        str(channel)
        .lower()
        .strip()

        for channel in (
            campaign.channels
            or []
        )

    ]


    if "push" not in channels:

        raise HTTPException(

            status_code=400,

            detail=(
                "This endpoint currently "
                "supports Push campaigns only."
            ),

        )


    # ========================================================
    # PREVENT DUPLICATE SEND
    # ========================================================

    existing_delivery = (

        db.query(
            Delivery
        )

        .filter(
            Delivery.campaign_id
            ==
            campaign.id,

            Delivery.channel
            ==
            "Push",

        )

        .first()

    )


    if existing_delivery:

        raise HTTPException(

            status_code=400,

            detail=(
                "This campaign already has "
                "a Push delivery."
            ),

        )


    # ========================================================
    # RESOLVE PUSH RECIPIENTS
    # ========================================================
    #
    # Priority:
    # 1. Selected audience -> all active FCM tokens
    # 2. Explicit token in campaign.recipients
    # 3. Current user's legacy FCM token
    #
    # This allows one campaign to reach multiple audience
    # members and multiple registered devices.
    #
    # ========================================================

    recipients = (
        campaign.recipients
        or {}
    )

    push_recipients = []


    # ========================================================
    # AUDIENCE -> MULTIPLE FCM TOKENS
    # ========================================================

    if campaign.audience_id is not None:

        audience_members = (

            db.query(
                AudienceMember,
                User,
            )

            .join(
                User,
                User.id
                ==
                AudienceMember.user_id,
            )

            .filter(
                AudienceMember.audience_id
                ==
                campaign.audience_id,
            )

            .all()

        )


        for member, user in audience_members:

            # ------------------------------------------------
            # Get all active FCM tokens for this audience user
            # ------------------------------------------------

            token_rows = (

                db.query(
                    FCMToken
                )

                .filter(
                    FCMToken.user_id
                    ==
                    user.id,

                    FCMToken.is_active
                    ==
                    True,

                )

                .all()

            )


            if token_rows:

                for token_row in token_rows:

                    if token_row.token:

                        push_recipients.append(
                            {
                                "user": user,
                                "token": token_row.token,
                                "recipient": (
                                    user.email
                                    or
                                    f"User:{user.id}"
                                ),
                            }
                        )


            # ------------------------------------------------
            # Backward-compatible fallback to User.fcm_token
            # ------------------------------------------------

            elif user.fcm_token:

                push_recipients.append(
                    {
                        "user": user,
                        "token": user.fcm_token,
                        "recipient": (
                            user.email
                            or
                            f"User:{user.id}"
                        ),
                    }
                )


    # ========================================================
    # EXPLICIT TOKEN FALLBACK
    # ========================================================

    if not push_recipients:

        fcm_token = (

            recipients.get("token")

            or recipients.get("fcm_token")

        )


        if fcm_token:

            push_recipients.append(
                {
                    "user": current_user,
                    "token": fcm_token,
                    "recipient": (
                        recipients.get("recipient")
                        or
                        recipients.get("email")
                        or
                        f"User:{current_user.id}"
                    ),
                }
            )


    # ========================================================
    # CURRENT USER TOKEN FALLBACK
    # ========================================================

    if not push_recipients:

        if current_user.fcm_token:

            push_recipients.append(
                {
                    "user": current_user,
                    "token": current_user.fcm_token,
                    "recipient": (
                        recipients.get("recipient")
                        or
                        recipients.get("email")
                        or
                        f"User:{current_user.id}"
                    ),
                }
            )


    # ========================================================
    # REMOVE DUPLICATE FCM TOKENS
    # ========================================================

    unique_recipients = []

    seen_tokens = set()


    for item in push_recipients:

        token = item["token"]


        if not token:
            continue


        if token in seen_tokens:
            continue


        seen_tokens.add(token)

        unique_recipients.append(item)


    push_recipients = unique_recipients


    if not push_recipients:

        raise HTTPException(

            status_code=400,

            detail=(
                "No FCM tokens found for the selected "
                "audience. Register FCM tokens for at least "
                "one audience member first."
            ),

        )


    # ========================================================
    # START CAMPAIGN
    # ========================================================

    campaign.status = "Sending"

    db.commit()

    db.refresh(
        campaign
    )


    # ========================================================
    # SEND TO EVERY FCM TOKEN
    # ========================================================

    successful_deliveries = []

    failed_deliveries = []


    for push_recipient in push_recipients:

        user = push_recipient["user"]

        fcm_token = push_recipient["token"]

        recipient = push_recipient["recipient"]


        # ----------------------------------------------------
        # CREATE DELIVERY RECORD
        # ----------------------------------------------------

        delivery = Delivery(

            campaign_id=
                campaign.id,

            channel=
                "Push",

            recipient=
                str(recipient),

            provider_message_id=
                None,

            status=
                "Sending",

            retry_count=
                0,

        )


        db.add(
            delivery
        )

        db.commit()

        db.refresh(
            delivery
        )


        # ----------------------------------------------------
        # SEND FCM
        # ----------------------------------------------------

        try:

            message_id = send_push_notification(

                fcm_token=
                    fcm_token,

                title=(
                    campaign.subject
                    or campaign.campaign_name
                ),

                body=
                    campaign.content,

            )


            # =================================================
            # SUCCESS
            # =================================================

            delivery.provider_message_id = (
                message_id
            )

            delivery.status = "Sent"

            delivery.sent_at = (
                datetime.utcnow()
            )

            delivery.error_message = None

            db.commit()

            db.refresh(
                delivery
            )


            successful_deliveries.append(
                delivery.id
            )


            print(
                "CAMPAIGN FCM SENT:",
                "USER:",
                user.id,
                "DELIVERY:",
                delivery.id,
                "MESSAGE:",
                message_id,
            )


        except Exception as error:

            # =================================================
            # FAILURE FOR THIS RECIPIENT
            # =================================================

            print(
                "CAMPAIGN FCM ERROR:",
                "USER:",
                user.id,
                error,
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


            failed_deliveries.append(
                delivery.id
            )


    # ========================================================
    # FINAL CAMPAIGN STATUS
    # ========================================================

    if successful_deliveries:

        campaign.status = "Completed"

        campaign.last_run_at = (
            datetime.utcnow()
        )

        campaign.next_run_at = None

        db.commit()

        db.refresh(
            campaign
        )


        # ----------------------------------------------------
        # NOTIFY CAMPAIGN MANAGER
        # ----------------------------------------------------

        create_campaign_notification(

            db=db,

            user=current_user,

            title="Campaign Completed",

            message=(
                f'Push campaign '
                f'"{campaign.campaign_name}" '
                f'was sent to '
                f'{len(successful_deliveries)} '
                f'recipient(s). '
                f'{len(failed_deliveries)} '
                f'failed.'
            ),

        )


        return {

            "success":
                True,

            "campaign_id":
                campaign.id,

            "channel":
                "Push",

            "total_recipients":
                len(push_recipients),

            "successful_deliveries":
                len(successful_deliveries),

            "failed_deliveries":
                len(failed_deliveries),

            "delivery_ids":
                successful_deliveries
                + failed_deliveries,

            "status":
                campaign.status,

            "campaign_status":
                campaign.status,

            "message":
                "Push campaign sent successfully.",

        }


    # ========================================================
    # ALL RECIPIENTS FAILED
    # ========================================================

    campaign.status = "Failed"

    db.commit()

    db.refresh(
        campaign
    )


    raise HTTPException(

        status_code=502,

        detail={

            "message":
                "Push campaign delivery failed.",

            "campaign_id":
                campaign.id,

            "successful_deliveries":
                0,

            "failed_deliveries":
                len(failed_deliveries),

            "error":
                "All Push recipients failed.",

        },

    )


# ============================================================
# GET ALL CAMPAIGNS
# ============================================================

@router.get(
    "/",
    response_model=list[CampaignResponse],
)
def get_campaigns(

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
    require_workspace_user
),
    

):

    return (

        db.query(
            Campaign
        )

        .all()

    )


# ============================================================
# GET SINGLE CAMPAIGN
# ============================================================

@router.get(
    "/{campaign_id}",
    response_model=CampaignResponse,
)
def get_campaign(

    campaign_id: int,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
    require_workspace_user
),

):

    campaign = (

        db.query(
            Campaign
        )

        .filter(
            Campaign.id
            ==
            campaign_id
        )

        .first()

    )


    if not campaign:

        raise HTTPException(

            status_code=404,

            detail="Campaign not found",

        )


    return campaign


# ============================================================
# ADMIN APPROVE CAMPAIGN
# ============================================================

@router.post(
    "/{campaign_id}/approve",
    response_model=CampaignResponse,
)
def approve_campaign(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    campaign = (
        db.query(Campaign)
        .filter(Campaign.id == campaign_id)
        .first()
    )

    if not campaign:
        raise HTTPException(
            status_code=404,
            detail="Campaign not found.",
        )

    if campaign.status != "Pending Review":
        raise HTTPException(
            status_code=400,
            detail=(
                "Only campaigns in Pending Review "
                "can be approved."
            ),
        )

    campaign.status = "Approved"

    db.commit()
    db.refresh(campaign)

    return campaign


# ============================================================
# ADMIN REJECT CAMPAIGN
# ============================================================

@router.post(
    "/{campaign_id}/reject",
    response_model=CampaignResponse,
)
def reject_campaign(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    campaign = (
        db.query(Campaign)
        .filter(Campaign.id == campaign_id)
        .first()
    )

    if not campaign:
        raise HTTPException(
            status_code=404,
            detail="Campaign not found.",
        )

    if campaign.status != "Pending Review":
        raise HTTPException(
            status_code=400,
            detail=(
                "Only campaigns in Pending Review "
                "can be rejected."
            ),
        )

    campaign.status = "Rejected"

    db.commit()
    db.refresh(campaign)

    return campaign


# ============================================================
# UPDATE CAMPAIGN
# ============================================================

@router.put(
    "/{campaign_id}",
    response_model=CampaignResponse,
)
def update_campaign(

    campaign_id: int,

    campaign_update: CampaignUpdate,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        require_campaign_manager
    ),

):

    try:

        # ====================================================
        # FIND CAMPAIGN
        # ====================================================

        campaign = (

            db.query(
                Campaign
            )

            .filter(
                Campaign.id
                ==
                campaign_id
            )

            .first()

        )


        if not campaign:

            raise HTTPException(

                status_code=404,

                detail="Campaign not found",

            )


        # ====================================================
        # VALIDATE STATUS
        # ====================================================

        if campaign_update.status not in VALID_STATUS:

            raise HTTPException(

                status_code=400,

                detail="Invalid campaign status.",

            )


        old_status = campaign.status

        new_status = campaign_update.status


        # ====================================================
        # ROLE-BASED STATUS CHANGE
        # ====================================================
        #
        # Campaign Manager:
        #   Draft / Rejected / Pending Review -> Draft or Pending Review
        #
        # Admin:
        #   Approval is handled by dedicated /approve and /reject
        #   endpoints.
        #
        # Communication Team:
        #   Delivery is handled by /channels/send.
        # ====================================================

        if new_status not in VALID_STATUS:

            raise HTTPException(
                status_code=400,
                detail="Invalid campaign status.",
            )

        if current_user.role == "Campaign Manager":

            if new_status not in {"Draft", "Pending Review"}:
                raise HTTPException(
                    status_code=403,
                    detail=(
                        "Campaign Manager can only save campaigns "
                        "as Draft or submit them for Pending Review."
                    ),
                )

            if old_status not in {
                "Draft",
                "Rejected",
                "Pending Review",
            }:
                raise HTTPException(
                    status_code=403,
                    detail=(
                        "Only Draft, Rejected, or Pending Review "
                        "campaigns can be edited by the Campaign Manager."
                    ),
                )


        # ====================================================
        # CHANNELS
        # ====================================================

        channels = [

            str(item)
            .lower()
            .strip()

            for item in campaign_update.channels

            if str(item).strip()

        ]


        channels = list(
            dict.fromkeys(
                channels
            )
        )


        if not channels:

            raise HTTPException(

                status_code=400,

                detail=(
                    "Select at least one "
                    "communication channel."
                ),

            )


        invalid_channels = [

            item

            for item in channels

            if item not in VALID_CHANNELS

        ]


        if invalid_channels:

            raise HTTPException(

                status_code=400,

                detail=(
                    "Unsupported channel(s): "
                    + ", ".join(
                        invalid_channels
                    )
                ),

            )


        # ====================================================
        # RECIPIENTS
        # ====================================================

        recipients = (

            campaign_update.recipients

            or {}

        )


        validate_schedule_payload(

            new_status,

            campaign_update.schedule_time,

            campaign_update.schedule_frequency,

            channels,

            recipients,

            campaign_update.audience_id,

        )


        # ====================================================
        # UPDATE FIELDS
        # ====================================================

        campaign.campaign_name = (

            campaign_update.campaign_name

        )


        campaign.campaign_type = (

            campaign_update.campaign_type

        )


        campaign.channels = (

            channels

        )


        campaign.subject = (

            campaign_update.subject

        )


        campaign.content = (

            campaign_update.content

        )


        campaign.audience_id = (

            campaign_update.audience_id

        )


        campaign.schedule_time = (

            campaign_update.schedule_time

        )


        campaign.schedule_frequency = (

            campaign_update.schedule_frequency

        )


        campaign.recipients = (

            recipients

        )


        campaign.next_run_at = (

            campaign_update.schedule_time

            if new_status == "Scheduled"

            else None

        )


        campaign.status = (

            new_status

        )


        # ====================================================
        # SAVE
        # ====================================================

        db.commit()

        db.refresh(
            campaign
        )


        # ====================================================
        # NOTIFICATION
        # ====================================================

        if old_status != new_status:

            notification_messages = {

                "Draft":
                    "Your campaign has been moved back to draft.",

                "Pending Review":
                    "Your campaign has been submitted for review.",

                "Approved":
                    "Your campaign has been approved successfully.",

                "Rejected":
                    "Your campaign has been rejected and requires changes.",

                "Scheduled":
                    "Your campaign has been scheduled successfully.",

                "Sending":
                    "Your campaign is now being sent.",

                "Completed":
                    "Your campaign has been completed successfully.",

                "Failed":
                    "Your campaign delivery has failed.",

            }


            message = notification_messages.get(

                new_status,

                f"Campaign status changed to {new_status}.",

            )


            create_campaign_notification(

                db=db,

                user=current_user,

                title=(
                    f"Campaign {new_status}"
                ),

                message=(

                    f'"{campaign.campaign_name}" '

                    f"— {message}"

                ),

            )


        else:

            create_campaign_notification(

                db=db,

                user=current_user,

                title="Campaign Updated",

                message=(

                    f'Your campaign '
                    f'"{campaign.campaign_name}" '
                    f'was updated successfully.'

                ),

            )


        return campaign


    except HTTPException:

        raise


    except SQLAlchemyError as error:

        db.rollback()

        print(
            "DATABASE UPDATE ERROR:",
            error,
        )

        raise HTTPException(

            status_code=500,

            detail=(
                f"Database error: "
                f"{str(error)}"
            ),

        )


    except Exception as error:

        db.rollback()

        print(
            "CAMPAIGN UPDATE ERROR:",
            error,
        )

        raise HTTPException(

            status_code=500,

            detail=(
                f"Campaign update failed: "
                f"{str(error)}"
            ),

        )


# ============================================================
# DELETE CAMPAIGN
# ============================================================

@router.delete(
    "/{campaign_id}"
)
def delete_campaign(

    campaign_id: int,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        require_campaign_manager
    ),

):

    try:

        campaign = (

            db.query(
                Campaign
            )

            .filter(
                Campaign.id
                ==
                campaign_id
            )

            .first()

        )


        if not campaign:

            raise HTTPException(

                status_code=404,

                detail="Campaign not found",

            )


        # Delivery and feedback rows reference this campaign. Remove the
        # dependent records first so deleting a campaign does not fail with
        # a database foreign-key error.
        db.query(Feedback).filter(
            Feedback.campaign_id == campaign_id
        ).delete(
            synchronize_session=False
        )

        db.query(Delivery).filter(
            Delivery.campaign_id == campaign_id
        ).delete(
            synchronize_session=False
        )

        db.delete(
            campaign
        )

        db.commit()


        return {

            "message":
                "Campaign deleted successfully"

        }


    except HTTPException:

        raise


    except SQLAlchemyError as error:

        db.rollback()

        print(
            "DATABASE DELETE ERROR:",
            error,
        )

        raise HTTPException(

            status_code=500,

            detail=(
                f"Database error: "
                f"{str(error)}"
            ),

        )


    except Exception as error:

        db.rollback()

        print(
            "CAMPAIGN DELETE ERROR:",
            error,
        )

        raise HTTPException(

            status_code=500,

            detail=(
                f"Campaign deletion failed: "
                f"{str(error)}"
            ),

        )