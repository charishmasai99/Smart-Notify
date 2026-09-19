"""add campaign type

Revision ID: 38f44c2ea025
Revises: 30b5c43676ca
Create Date: 2026-08-20 10:31:46.956702

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "38f44c2ea025"

down_revision: Union[str, Sequence[str], None] = "30b5c43676ca"

branch_labels: Union[str, Sequence[str], None] = None

depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:

    op.add_column(
        "campaign",
        sa.Column(
            "campaign_type",
            sa.String(length=100),
            nullable=False,
            server_default="Announcement",
        ),
    )


def downgrade() -> None:

    op.drop_column(
        "campaign",
        "campaign_type",
    )