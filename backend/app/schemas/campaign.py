from pydantic import BaseModel


class CampaignCreate(BaseModel):
    campaign_name: str
    subject: str
    content: str
    audience_id: int
    schedule_time: str
    status: str


class CampaignResponse(BaseModel):
    id: int
    campaign_name: str
    subject: str
    content: str
    audience_id: int
    schedule_time: str
    status: str

    class Config:
        from_attributes = True
class CampaignUpdate(BaseModel):
    campaign_name: str
    subject: str
    content: str
    audience_id: int
    schedule_time: str
    status: str