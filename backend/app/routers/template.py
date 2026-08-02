from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.db import get_db

from app.models.template import Template
from app.models.user import User

from app.schemas.template import (
    TemplateCreate,
    TemplateUpdate,
    TemplateResponse,
)

from app.utils.roles import (
    require_campaign_manager,
    require_communication_team,
)

router = APIRouter(
    prefix="/template",
    tags=["Template"],
)


@router.post("/", response_model=TemplateResponse)
def create_template(
    template: TemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_campaign_manager),
):
    new_template = Template(
        template_name=template.template_name,
        template_type=template.template_type,
        content=template.content,
    )

    db.add(new_template)
    db.commit()
    db.refresh(new_template)

    return new_template


@router.get("/", response_model=list[TemplateResponse])
def get_templates(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_communication_team),
):
    return db.query(Template).all()


@router.get("/{template_id}", response_model=TemplateResponse)
def get_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_communication_team),
):
    template = db.query(Template).filter(
        Template.id == template_id
    ).first()

    if not template:
        raise HTTPException(
            status_code=404,
            detail="Template not found",
        )

    return template


@router.put("/{template_id}", response_model=TemplateResponse)
def update_template(
    template_id: int,
    template_update: TemplateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_campaign_manager),
):
    template = db.query(Template).filter(
        Template.id == template_id
    ).first()

    if not template:
        raise HTTPException(
            status_code=404,
            detail="Template not found",
        )

    template.template_name = template_update.template_name
    template.template_type = template_update.template_type
    template.content = template_update.content

    db.commit()
    db.refresh(template)

    return template


@router.delete("/{template_id}")
def delete_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_campaign_manager),
):
    template = db.query(Template).filter(
        Template.id == template_id
    ).first()

    if not template:
        raise HTTPException(
            status_code=404,
            detail="Template not found",
        )

    db.delete(template)
    db.commit()

    return {
        "message": "Template deleted successfully"
    }