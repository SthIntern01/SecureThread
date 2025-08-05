# Create this file: backend/alembic/versions/add_scan_metadata_if_not_exists.py

"""add scan_metadata column if not exists

Revision ID: add_scan_metadata_fix
Revises: 21aa09fdad18
Create Date: 2024-12-19 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text

# revision identifiers, used by Alembic.
revision: str = 'add_scan_metadata_fix'
down_revision: Union[str, None] = '21aa09fdad18'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Check if the column already exists before adding it
    connection = op.get_bind()
    
    # For PostgreSQL
    result = connection.execute(text("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='scans' AND column_name='scan_metadata'
    """))
    
    column_exists = result.fetchone() is not None
    
    if not column_exists:
        op.add_column('scans', sa.Column('scan_metadata', sa.JSON(), nullable=True))
        print("Added scan_metadata column to scans table")
    else:
        print("scan_metadata column already exists in scans table")


def downgrade() -> None:
    # Only drop if it exists
    connection = op.get_bind()
    
    result = connection.execute(text("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='scans' AND column_name='scan_metadata'
    """))
    
    column_exists = result.fetchone() is not None
    
    if column_exists:
        op.drop_column('scans', 'scan_metadata')