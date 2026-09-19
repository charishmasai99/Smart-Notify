from pydantic import BaseModel


class AudienceCreate(BaseModel):
    name: str
    audience_type: str
    description: str | None = None
    state: str | None = None
    gender: str | None = None
    language: str | None = None
    occupation: str | None = None


class AudienceResponse(BaseModel):
    id: int
    name: str
    audience_type: str
    description: str | None = None
    state: str | None = None
    gender: str | None = None
    language: str | None = None
    occupation: str | None = None

    class Config:
        from_attributes = True