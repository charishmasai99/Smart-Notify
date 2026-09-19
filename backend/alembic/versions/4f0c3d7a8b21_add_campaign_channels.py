"""add campaign distribution channels

Revision ID: 4f0c3d7a8b21
Revises: 38f44c2ea025
Create Date: 2026-08-20 11:45:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "4f0c3d7a8b21"
down_revision: Union[str, None] = "38f44c2ea025"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "campaign",
        sa.Column(
            "channels",
            postgresql.JSON(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[\"email\"]'::json"),
        ),
    )
    op.alter_column("campaign", "channels", server_default=None)


def downgrade() -> None:
    op.drop_column("campaign", "channels")
