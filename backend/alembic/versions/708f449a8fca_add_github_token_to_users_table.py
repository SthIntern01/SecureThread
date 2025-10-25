"""Add github_token to users table

Revision ID: 708f449a8fca
Revises: 1408d55e1378
Create Date: 2025-10-15 11:25:10.440034

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '708f449a8fca'
down_revision: Union[str, None] = '1408d55e1378'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('users', sa.Column('github_token', sa.String(255), nullable=True))

def downgrade():
    op.drop_column('users', 'github_token')
