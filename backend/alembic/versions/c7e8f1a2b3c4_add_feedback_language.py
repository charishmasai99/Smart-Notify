"""add language to feedback

Revision ID: c7e8f1a2b3c4
Revises: a296ef8a6ab3
Create Date: 2026-09-04 00:00:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c7e8f1a2b3c4"
down_revision: Union[str, Sequence[str], None] = "a296ef8a6ab3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add the field to the EXISTING feedback table.
    # The temporary server default backfills existing rows safely.
    op.add_column(
        "feedback",
        sa.Column(
            "language",
            sa.String(length=30),
            nullable=False,
            server_default="English",
        ),
    )

    op.create_index(
        "ix_feedback_language",
        "feedback",
        ["language"],
        unique=False,
    )

    # Keep the default at the application/model layer instead of
    # forcing every future insert at the database level.
    op.alter_column(
        "feedback",
        "language",
        server_default=None,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_feedback_language",
        table_name="feedback",
    )
    op.drop_column(
        "feedback",
        "language",
    )
