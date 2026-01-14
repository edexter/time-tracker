"""Change datetime columns to timezone-naive

Revision ID: 20260114102012
Revises: 0ec96ae8b10a
Create Date: 2026-01-14 10:20:12.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20260114102012'
down_revision = '0ec96ae8b10a'
branch_labels = None
depends_on = None


def upgrade():
    # SQLite doesn't support ALTER COLUMN directly, so we use batch operations
    # This recreates tables with the new column types

    # Update work_sessions table
    with op.batch_alter_table('work_sessions', schema=None) as batch_op:
        batch_op.alter_column('start_time',
                              existing_type=sa.DateTime(timezone=True),
                              type_=sa.DateTime(timezone=False),
                              existing_nullable=False)
        batch_op.alter_column('end_time',
                              existing_type=sa.DateTime(timezone=True),
                              type_=sa.DateTime(timezone=False),
                              existing_nullable=True)
        batch_op.alter_column('created_at',
                              existing_type=sa.DateTime(timezone=True),
                              type_=sa.DateTime(timezone=False),
                              existing_nullable=True)
        batch_op.alter_column('updated_at',
                              existing_type=sa.DateTime(timezone=True),
                              type_=sa.DateTime(timezone=False),
                              existing_nullable=True)

    # Update clients table
    with op.batch_alter_table('clients', schema=None) as batch_op:
        batch_op.alter_column('created_at',
                              existing_type=sa.DateTime(timezone=True),
                              type_=sa.DateTime(timezone=False),
                              existing_nullable=True)
        batch_op.alter_column('updated_at',
                              existing_type=sa.DateTime(timezone=True),
                              type_=sa.DateTime(timezone=False),
                              existing_nullable=True)

    # Update projects table
    with op.batch_alter_table('projects', schema=None) as batch_op:
        batch_op.alter_column('created_at',
                              existing_type=sa.DateTime(timezone=True),
                              type_=sa.DateTime(timezone=False),
                              existing_nullable=True)
        batch_op.alter_column('updated_at',
                              existing_type=sa.DateTime(timezone=True),
                              type_=sa.DateTime(timezone=False),
                              existing_nullable=True)

    # Update time_allocations table
    with op.batch_alter_table('time_allocations', schema=None) as batch_op:
        batch_op.alter_column('created_at',
                              existing_type=sa.DateTime(timezone=True),
                              type_=sa.DateTime(timezone=False),
                              existing_nullable=True)
        batch_op.alter_column('updated_at',
                              existing_type=sa.DateTime(timezone=True),
                              type_=sa.DateTime(timezone=False),
                              existing_nullable=True)

    # Update login_attempts table
    with op.batch_alter_table('login_attempts', schema=None) as batch_op:
        batch_op.alter_column('attempted_at',
                              existing_type=sa.DateTime(timezone=True),
                              type_=sa.DateTime(timezone=False),
                              existing_nullable=True)


def downgrade():
    # Reverse the changes - convert back to timezone-aware

    with op.batch_alter_table('login_attempts', schema=None) as batch_op:
        batch_op.alter_column('attempted_at',
                              existing_type=sa.DateTime(timezone=False),
                              type_=sa.DateTime(timezone=True),
                              existing_nullable=True)

    with op.batch_alter_table('time_allocations', schema=None) as batch_op:
        batch_op.alter_column('updated_at',
                              existing_type=sa.DateTime(timezone=False),
                              type_=sa.DateTime(timezone=True),
                              existing_nullable=True)
        batch_op.alter_column('created_at',
                              existing_type=sa.DateTime(timezone=False),
                              type_=sa.DateTime(timezone=True),
                              existing_nullable=True)

    with op.batch_alter_table('projects', schema=None) as batch_op:
        batch_op.alter_column('updated_at',
                              existing_type=sa.DateTime(timezone=False),
                              type_=sa.DateTime(timezone=True),
                              existing_nullable=True)
        batch_op.alter_column('created_at',
                              existing_type=sa.DateTime(timezone=False),
                              type_=sa.DateTime(timezone=True),
                              existing_nullable=True)

    with op.batch_alter_table('clients', schema=None) as batch_op:
        batch_op.alter_column('updated_at',
                              existing_type=sa.DateTime(timezone=False),
                              type_=sa.DateTime(timezone=True),
                              existing_nullable=True)
        batch_op.alter_column('created_at',
                              existing_type=sa.DateTime(timezone=False),
                              type_=sa.DateTime(timezone=True),
                              existing_nullable=True)

    with op.batch_alter_table('work_sessions', schema=None) as batch_op:
        batch_op.alter_column('updated_at',
                              existing_type=sa.DateTime(timezone=False),
                              type_=sa.DateTime(timezone=True),
                              existing_nullable=True)
        batch_op.alter_column('created_at',
                              existing_type=sa.DateTime(timezone=False),
                              type_=sa.DateTime(timezone=True),
                              existing_nullable=True)
        batch_op.alter_column('end_time',
                              existing_type=sa.DateTime(timezone=False),
                              type_=sa.DateTime(timezone=True),
                              existing_nullable=True)
        batch_op.alter_column('start_time',
                              existing_type=sa.DateTime(timezone=False),
                              type_=sa.DateTime(timezone=True),
                              existing_nullable=False)
