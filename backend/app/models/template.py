from sqlalchemy import Column, Integer, String

from app.database.base import Base


class Template(Base):
    __tablename__ = "template"

    id = Column(Integer, primary_key=True, index=True)

    template_name = Column(
        String,
        nullable=False
    )

    template_type = Column(
        String,
        nullable=False
    )

    content = Column(
        String,
        nullable=False
    )