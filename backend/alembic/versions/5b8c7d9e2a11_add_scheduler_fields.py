"""add scheduler and automatic retry fields

Revision ID: 5b8c7d9e2a11
Revises: 4f0c3d7a8b21
Create Date: 2026-08-22 16:30:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "5b8c7d9e2a11"
down_revision: Union[str, None] = "4f0c3d7a8b21"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Fix the old campaign schedule column so it matches the Pydantic datetime field.
    op.alter_column(
        "campaign",
        "schedule_time",
        existing_type=sa.String(),
        type_=sa.DateTime(),
        existing_nullable=True,
        postgresql_using="NULLIF(schedule_time, '')::timestamp",
    )

    op.add_column(
        "campaign",
        sa.Column("schedule_frequency", sa.String(length=30), nullable=False, server_default="one_time"),
    )
    op.add_column(
        "campaign",
        sa.Column(
            "recipients",
            postgresql.JSON(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::json"),
        ),
    )
    op.add_column(
        "campaign",
        sa.Column("next_run_at", sa.DateTime(), nullable=True),
    )
    op.add_column(
        "campaign",
        sa.Column("last_run_at", sa.DateTime(), nullable=True),
    )

    op.add_column(
        "deliveries",
        sa.Column("next_retry_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_deliveries_next_retry_at", "deliveries", ["next_retry_at"])

    # Existing scheduled campaigns keep working without user edits.
    op.execute(
        "UPDATE campaign SET next_run_at = schedule_time "
        "WHERE status = 'Scheduled' AND schedule_time IS NOT NULL"
    )

    op.alter_column("campaign", "schedule_frequency", server_default=None)
    op.alter_column("campaign", "recipients", server_default=None)


def downgrade() -> None:
    op.drop_index("ix_deliveries_next_retry_at", table_name="deliveries")
    op.drop_column("deliveries", "next_retry_at")
    op.drop_column("campaign", "last_run_at")
    op.drop_column("campaign", "next_run_at")
    op.drop_column("campaign", "recipients")
    op.drop_column("campaign", "schedule_frequency")
    op.alter_column(
        "campaign",
        "schedule_time",
        existing_type=sa.DateTime(),
        type_=sa.String(),
        existing_nullable=True,
    )
