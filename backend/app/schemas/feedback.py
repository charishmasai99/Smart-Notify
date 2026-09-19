from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class FeedbackCreate(BaseModel):

    campaign_id: int

    delivery_id: Optional[int] = None

    recipient: Optional[str] = None

    channel: str = "email"

    language: str = Field(
        default="English",
        min_length=2,
        max_length=30,
    )

    message: str = Field(
        ...,
        min_length=1,
        max_length=5000,
    )

    rating: Optional[int] = Field(
        default=None,
        ge=1,
        le=5,
    )


class FeedbackResponse(BaseModel):

    id: int

    campaign_id: int

    delivery_id: Optional[int]

    recipient: Optional[str]

    channel: str

    language: str

    message: str

    rating: Optional[int]

    sentiment: Optional[str]

    sentiment_score: Optional[int]

    created_at: datetime

    class Config:
        from_attributes = True