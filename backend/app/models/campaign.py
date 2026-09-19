from sqlalchemy import (
    Column,
    Integer,
    String,
    ForeignKey,
    JSON,
    DateTime,
)

from app.database.base import Base


class Campaign(Base):

    __tablename__ = "campaign"


    # ============================================================
    # ID
    # ============================================================

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )


    # ============================================================
    # CAMPAIGN NAME
    # ============================================================

    campaign_name = Column(
        String,
        nullable=False,
    )


    # ============================================================
    # CAMPAIGN TYPE
    # ============================================================

    campaign_type = Column(
        String(100),
        nullable=False,
        default="Announcement",
    )


    # ============================================================
    # DISTRIBUTION CHANNELS
    # ============================================================

    channels = Column(
        JSON,
        nullable=False,
        default=lambda: ["email"],
    )


    # ============================================================
    # SUBJECT
    # ============================================================

    subject = Column(
        String,
        nullable=False,
    )


    # ============================================================
    # CONTENT
    # ============================================================

    content = Column(
        String,
        nullable=False,
    )


    # ============================================================
    # AUDIENCE
    # ============================================================

    audience_id = Column(
        Integer,
        ForeignKey("audience.id"),
        nullable=True,
    )


    # ============================================================
    # SCHEDULE
    # ============================================================

    schedule_time = Column(
        DateTime,
        nullable=True,
    )


    # ============================================================
    # SCHEDULE FREQUENCY
    # ============================================================

    schedule_frequency = Column(
        String(30),
        nullable=False,
        default="one_time",
    )


    # ============================================================
    # SCHEDULED RECIPIENTS
    # ============================================================

    recipients = Column(
        JSON,
        nullable=False,
        default=dict,
    )


    # ============================================================
    # NEXT SCHEDULE RUN
    # ============================================================

    next_run_at = Column(
        DateTime,
        nullable=True,
        index=True,
    )


    # ============================================================
    # LAST SCHEDULE RUN
    # ============================================================

    last_run_at = Column(
        DateTime,
        nullable=True,
    )


    # ============================================================
    # STATUS
    # ============================================================

    status = Column(
        String,
        default="Draft",
    )