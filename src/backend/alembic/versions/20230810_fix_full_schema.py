"""Add all missing columns to users and backups tables

Revision ID: 20230810_fix_full_schema
Revises: 20230810_add_missing_columns
Create Date: 2026-08-10
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = '20230810_fix_full_schema'
down_revision: Union[str, Sequence[str], None] = '20230810_add_missing_columns'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def column_exists(table, column):
    conn = op.get_bind()
    result = conn.execute(sa.text(
        "SELECT COUNT(*) FROM information_schema.columns "
        "WHERE table_name=:t AND column_name=:c"
    ), {"t": table, "c": column})
    return result.scalar() > 0


def upgrade() -> None:
    # ── users ──────────────────────────────────────────────────────────────
    if not column_exists('users', 'created_at'):
        op.add_column('users', sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            nullable=True,
            server_default=sa.text('NOW()')
        ))

    # ── backups ─────────────────────────────────────────────────────────────
    cols_to_add = [
        ('backup_name',   sa.String(255),              False, None),
        ('backup_type',   sa.String(50),               True,  'FULL'),
        ('source',        sa.String(255),              True,  None),
        ('destination',   sa.String(255),              True,  None),
        ('size',          sa.String(50),               True,  '0 MB'),
        ('size_bytes',    sa.BigInteger(),             True,  None),
        ('started_at',    sa.DateTime(timezone=True),  True,  'NOW()'),
        ('completed_at',  sa.DateTime(timezone=True),  True,  None),
        ('duration',      sa.String(50),               True,  None),
    ]
    for col_name, col_type, nullable, default in cols_to_add:
        if not column_exists('backups', col_name):
            kw = {}
            if default is not None:
                kw['server_default'] = sa.text(f"'{default}'") if default != 'NOW()' else sa.text('NOW()')
            op.add_column('backups', sa.Column(col_name, col_type, nullable=nullable, **kw))

    # Backfill backup_name from system_name for existing rows
    op.execute(sa.text(
        "UPDATE backups SET backup_name = COALESCE(system_name, file_name, 'Unknown') "
        "WHERE backup_name IS NULL OR backup_name = ''"
    ))


def downgrade() -> None:
    pass
