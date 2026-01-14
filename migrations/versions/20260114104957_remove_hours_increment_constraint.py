"""Remove hours increment constraint

Revision ID: 20260114104957
Revises: 20260114102012
Create Date: 2026-01-14 10:49:57.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20260114104957'
down_revision = '20260114102012'
branch_labels = None
depends_on = None


def upgrade():
    # Drop the CHECK constraint that enforces 0.25 hour increments
    # SQLite handles this differently - need to recreate the table without the constraint
    with op.batch_alter_table('time_allocations', schema=None) as batch_op:
        batch_op.drop_constraint('check_hours_increment', type_='check')


def downgrade():
    # Restore the CHECK constraint
    with op.batch_alter_table('time_allocations', schema=None) as batch_op:
        batch_op.create_check_constraint(
            'check_hours_increment',
            'hours > 0 AND MOD(hours * 4, 1) = 0'
        )
