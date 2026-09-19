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


class Feedback(Base):

    __tablename__ = "feedback"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    campaign_id = Column(
        Integer,
        ForeignKey("campaign.id"),
        nullable=False,
        index=True,
    )

    delivery_id = Column(
        Integer,
        ForeignKey("deliveries.id"),
        nullable=True,
        index=True,
    )

    recipient = Column(
        String(255),
        nullable=True,
    )

    channel = Column(
        String(50),
        nullable=False,
        index=True,
    )

    # Language selected by the recipient when submitting feedback.
    # Stored on the existing feedback table for language-wise analytics.
    language = Column(
        String(30),
        nullable=False,
        default="English",
        server_default="English",
        index=True,
    )

    message = Column(
        Text,
        nullable=False,
    )

    rating = Column(
        Integer,
        nullable=True,
    )

    sentiment = Column(
        String(30),
        nullable=True,
        index=True,
    )

    sentiment_score = Column(
        Integer,
        nullable=True,
    )

    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        index=True,
    )


Index(
    "ix_feedback_campaign_sentiment",
    Feedback.campaign_id,
    Feedback.sentiment,
)