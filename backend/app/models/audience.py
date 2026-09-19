from sqlalchemy import Column, Integer, String
from app.database.base import Base


class Audience(Base):
    __tablename__ = "audience"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(String)

    audience_type = Column(String)

    description = Column(String)

    state = Column(String)

    gender = Column(String)

    language = Column(String)

    occupation = Column(String)