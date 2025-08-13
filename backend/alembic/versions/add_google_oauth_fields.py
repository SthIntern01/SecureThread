"""Add Google OAuth fields to user table

Revision ID: add_google_oauth_fields
Revises: 10422572eb62
Create Date: 2025-01-13 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = 'add_google_oauth_fields'
down_revision = '10422572eb62'  # Replace with your latest revision ID
branch_labels = None
depends_on = None

def upgrade():
    # Add Google OAuth fields to users table
    op.add_column('users', sa.Column('google_id', sa.String(), nullable=True))
    op.add_column('users', sa.Column('google_email', sa.String(), nullable=True))
    op.add_column('users', sa.Column('google_access_token', sa.Text(), nullable=True))
    op.add_column('users', sa.Column('google_refresh_token', sa.Text(), nullable=True))
    
    # Create unique indexes
    op.create_index('ix_users_google_id', 'users', ['google_id'], unique=True)

def downgrade():
    # Remove indexes first
    op.drop_index('ix_users_google_id', 'users')
    
    # Remove columns
    op.drop_column('users', 'google_refresh_token')
    op.drop_column('users', 'google_access_token')
    op.drop_column('users', 'google_email')
    op.drop_column('users', 'google_id')