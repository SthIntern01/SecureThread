"""add_bitbucket_gitlab_support_to_repository

Revision ID: 1408d55e1378
Revises: 2a5164ebfc83
Create Date: 2025-09-18 15:16:36.459952

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1408d55e1378'
down_revision: Union[str, None] = '2a5164ebfc83'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add new columns for multi-provider support
    op.add_column('repositories', sa.Column('bitbucket_id', sa.String(), nullable=True))
    op.add_column('repositories', sa.Column('gitlab_id', sa.String(), nullable=True))
    
    # Make github_id nullable and remove unique constraint
    op.alter_column('repositories', 'github_id',
               existing_type=sa.INTEGER(),
               nullable=True)
    
    # Update indexes
    op.drop_index(op.f('ix_repositories_github_id'), table_name='repositories')
    op.create_index(op.f('ix_repositories_github_id'), 'repositories', ['github_id'], unique=False)
    op.create_index(op.f('ix_repositories_bitbucket_id'), 'repositories', ['bitbucket_id'], unique=False)
    op.create_index(op.f('ix_repositories_gitlab_id'), 'repositories', ['gitlab_id'], unique=False)
    
    # REMOVED: Don't change email constraint - keep it nullable for OAuth users


def downgrade() -> None:
    # Reverse the repository changes
    op.drop_index(op.f('ix_repositories_gitlab_id'), table_name='repositories')
    op.drop_index(op.f('ix_repositories_bitbucket_id'), table_name='repositories')
    op.drop_index(op.f('ix_repositories_github_id'), table_name='repositories')
    op.create_index(op.f('ix_repositories_github_id'), 'repositories', ['github_id'], unique=True)
    op.alter_column('repositories', 'github_id',
               existing_type=sa.INTEGER(),
               nullable=False)
    op.drop_column('repositories', 'gitlab_id')
    op.drop_column('repositories', 'bitbucket_id')
    
    # REMOVED: Don't revert email changes