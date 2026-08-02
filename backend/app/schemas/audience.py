from pydantic import BaseModel

class AudienceCreate(BaseModel):
    name: str
    audience_type: str
    description: str

class AudienceResponse(BaseModel):
    id: int
    name: str
    audience_type: str
    description: str

    class Config:
        from_attributes = True