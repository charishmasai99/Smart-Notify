from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    ForeignKey,
    Index,
)

from app.database.base import Base


class Delivery(Base):

    __tablename__ = "deliveries"


    # ========================================================
    # PRIMARY KEY
    # ========================================================

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )


    # ========================================================
    # CAMPAIGN
    # ========================================================

    campaign_id = Column(
        Integer,
        ForeignKey("campaign.id"),
        nullable=False,
        index=True,
    )


    # ========================================================
    # CHANNEL
    # ========================================================

    channel = Column(
        String(50),
        nullable=False,
        index=True,
    )


    # ========================================================
    # RECIPIENT
    # ========================================================

    recipient = Column(
        String(100),
        nullable=False,
    )


    # ========================================================
    # PROVIDER MESSAGE ID
    # ========================================================

    provider_message_id = Column(
        String(255),
        nullable=True,
        index=True,
    )


    # ========================================================
    # EMAIL TRACKING TOKEN
    # ========================================================

    tracking_token = Column(
        String(128),
        nullable=True,
        index=True,
    )


    # ========================================================
    # DELIVERY STATUS
    # ========================================================

    status = Column(
        String(30),
        nullable=False,
        default="Queued",
        index=True,
    )


    # ========================================================
    # ERROR
    # ========================================================

    error_message = Column(
        Text,
        nullable=True,
    )


    # ========================================================
    # RETRY COUNT
    # ========================================================

    retry_count = Column(
        Integer,
        nullable=False,
        default=0,
    )


    # ========================================================
    # NEXT AUTOMATIC RETRY
    # ========================================================

    next_retry_at = Column(
        DateTime,
        nullable=True,
        index=True,
    )


    # ========================================================
    # CREATED
    # ========================================================

    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )


    # ========================================================
    # SENT
    # ========================================================

    sent_at = Column(
        DateTime,
        nullable=True,
    )


    # ========================================================
    # DELIVERED
    # ========================================================

    delivered_at = Column(
        DateTime,
        nullable=True,
    )


    # ========================================================
    # FAILED
    # ========================================================

    failed_at = Column(
        DateTime,
        nullable=True,
    )


    # ========================================================
    # ENGAGEMENT TRACKING
    # ========================================================

    opened_at = Column(
        DateTime,
        nullable=True,
        index=True,
    )

    clicked_at = Column(
        DateTime,
        nullable=True,
        index=True,
    )

    click_count = Column(
        Integer,
        nullable=False,
        default=0,
    )


# ============================================================
# COMPOSITE INDEX
# ============================================================

Index(
    "ix_delivery_campaign_status",
    Delivery.campaign_id,
    Delivery.status,
)