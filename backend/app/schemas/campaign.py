from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


DEFAULT_CHANNELS = ["email"]
VALID_FREQUENCIES = {"one_time", "daily", "weekly", "monthly"}


class CampaignCreate(BaseModel):
    campaign_name: str
    campaign_type: str = "Announcement"
    subject: str
    content: str
    channels: list[str] = Field(default_factory=lambda: DEFAULT_CHANNELS.copy())
    audience_id: Optional[int] = None
    schedule_time: Optional[datetime] = None
    schedule_frequency: str = "one_time"
    recipients: dict[str, str] = Field(default_factory=dict)
    status: str = "Draft"


class CampaignUpdate(BaseModel):
    campaign_name: str
    campaign_type: str = "Announcement"
    subject: str
    content: str
    channels: list[str] = Field(default_factory=lambda: DEFAULT_CHANNELS.copy())
    audience_id: Optional[int] = None
    schedule_time: Optional[datetime] = None
    schedule_frequency: str = "one_time"
    recipients: dict[str, str] = Field(default_factory=dict)
    status: str


class CampaignResponse(BaseModel):
    id: int
    campaign_name: str
    campaign_type: str
    subject: str
    content: str
    channels: list[str] = Field(default_factory=lambda: DEFAULT_CHANNELS.copy())
    audience_id: Optional[int] = None
    schedule_time: Optional[datetime] = None
    schedule_frequency: str = "one_time"
    recipients: dict[str, str] = Field(default_factory=dict)
    next_run_at: Optional[datetime] = None
    last_run_at: Optional[datetime] = None
    status: str

    model_config = ConfigDict(from_attributes=True)
