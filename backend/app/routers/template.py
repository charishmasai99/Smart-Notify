from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import SQLAlchemyError
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
    require_workspace_user,
    require_campaign_manager,
    require_communication_team,
)


router = APIRouter(
    prefix="/template",
    tags=["Template"],
)


# ============================================================
# CREATE TEMPLATE
# ============================================================

@router.post(
    "/",
    response_model=TemplateResponse
)
def create_template(
    template: TemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_campaign_manager
    ),
):
    try:
        print(
            "CREATE TEMPLATE:",
            template.model_dump()
        )

        new_template = Template(
            template_name=template.template_name.strip(),
            template_type=template.template_type,
            content=template.content.strip(),
        )

        db.add(new_template)
        db.commit()
        db.refresh(new_template)

        return new_template

    except SQLAlchemyError as error:
        db.rollback()

        print(
            "TEMPLATE DATABASE ERROR:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="Database error while creating template."
        )

    except Exception as error:
        db.rollback()

        print(
            "TEMPLATE CREATE ERROR:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


# ============================================================
# GET ALL TEMPLATES
# ============================================================

@router.get(
    "/",
    response_model=list[TemplateResponse]
)
def get_templates(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_workspace_user
    ),
):
    return (
        db.query(Template)
        .order_by(Template.id.desc())
        .all()
    )


# ============================================================
# GET TEMPLATE BY ID
# ============================================================

@router.get(
    "/{template_id}",
    response_model=TemplateResponse
)
def get_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_workspace_user
    ),
):
    template = (
        db.query(Template)
        .filter(Template.id == template_id)
        .first()
    )

    if template is None:
        raise HTTPException(
            status_code=404,
            detail="Template not found"
        )

    return template


# ============================================================
# UPDATE TEMPLATE
# ============================================================

@router.put(
    "/{template_id}",
    response_model=TemplateResponse
)
def update_template(
    template_id: int,
    template_update: TemplateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_campaign_manager
    ),
):
    try:
        template = (
            db.query(Template)
            .filter(Template.id == template_id)
            .first()
        )

        if template is None:
            raise HTTPException(
                status_code=404,
                detail="Template not found"
            )

        print(
            "UPDATE TEMPLATE:",
            template_update.model_dump()
        )

        template.template_name = (
            template_update.template_name.strip()
        )

        template.template_type = (
            template_update.template_type
        )

        template.content = (
            template_update.content.strip()
        )

        db.commit()
        db.refresh(template)

        return template

    except HTTPException:
        raise

    except SQLAlchemyError as error:
        db.rollback()

        print(
            "TEMPLATE UPDATE DATABASE ERROR:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="Database error while updating template."
        )

    except Exception as error:
        db.rollback()

        print(
            "TEMPLATE UPDATE ERROR:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


# ============================================================
# DELETE TEMPLATE
# ============================================================

@router.delete(
    "/{template_id}"
)
def delete_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_campaign_manager
    ),
):
    try:
        template = (
            db.query(Template)
            .filter(Template.id == template_id)
            .first()
        )

        if template is None:
            raise HTTPException(
                status_code=404,
                detail="Template not found"
            )

        db.delete(template)
        db.commit()

        return {
            "message": "Template deleted successfully"
        }

    except HTTPException:
        raise

    except SQLAlchemyError as error:
        db.rollback()

        print(
            "TEMPLATE DELETE DATABASE ERROR:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="Database error while deleting template."
        )