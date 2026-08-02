from sqlalchemy import Column, Integer, String, ForeignKey
from app.database.base import Base
from app.utils.workflow import WORKFLOW

class Campaign(Base):
    __tablename__ = "campaign"

    id = Column(Integer, primary_key=True, index=True)

    campaign_name = Column(String, nullable=False)
    subject = Column(String, nullable=False)
    content = Column(String, nullable=False)

    audience_id = Column(Integer, ForeignKey("audience.id"))

    schedule_time = Column(String)

    status = Column(String, default="Draft")