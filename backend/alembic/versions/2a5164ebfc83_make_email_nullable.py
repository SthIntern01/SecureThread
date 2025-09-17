"""make_email_nullable

Revision ID: 2a5164ebfc83
Revises: 6029f7da3616
Create Date: 2025-09-17 14:34:00.707369

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2a5164ebfc83'
down_revision: Union[str, None] = '6029f7da3616'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # Make email nullable
    op.alter_column('users', 'email',
                    existing_type=sa.String(),
                    nullable=True)

def downgrade():
    # Revert email to not nullable  
    op.alter_column('users', 'email',
                    existing_type=sa.String(),
                    nullable=False)
