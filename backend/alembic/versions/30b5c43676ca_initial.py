"""initial database baseline

Revision ID: 30b5c43676ca
Revises:
Create Date: 2026-08-20 10:27:17.513850
"""

from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "30b5c43676ca"

down_revision: Union[str, Sequence[str], None] = None

branch_labels: Union[str, Sequence[str], None] = None

depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Existing SmartNotify database baseline.

    The database already contains the existing tables.
    Alembic is being introduced after the database was created,
    so this migration intentionally makes no schema changes.
    """
    pass


def downgrade() -> None:
    """
    Baseline migration intentionally has no downgrade operations.
    """
    pass