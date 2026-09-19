from datetime import datetime

from pydantic import (
    BaseModel,
    ConfigDict,
)


class FCMTokenRequest(BaseModel):
    token: str


class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )


class NotificationReadRequest(BaseModel):
    is_read: bool = True