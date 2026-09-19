from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    DateTime,
    ForeignKey,
    UniqueConstraint,
)

from app.database.base import Base


class AudienceMember(Base):
    __tablename__ = "audience_members"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    audience_id = Column(
        Integer,
        ForeignKey("audience.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    __table_args__ = (
        UniqueConstraint(
            "audience_id",
            "user_id",
            name="uq_audience_member",
        ),
    )
