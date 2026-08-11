'''Add missing columns to users and backups tables'''

from typing import Sequence, Union

# pyrefly: ignore [missing-module-attribute]
from alembic import op
# pyrefly: ignore [missing-import]
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '20230810_add_missing_columns'
down_revision: Union[str, Sequence[str], None] = 'c2e0f17f9109'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Add role column to users if not exists
    op.add_column('users', sa.Column('role', sa.String(length=50), nullable=False, server_default='READ_ONLY'))
    # Add server_id column to backups if not exists (foreign key to servers.id)
    op.add_column('backups', sa.Column('server_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_backups_server_id', 'backups', 'servers', ['server_id'], ['id'], ondelete='SET NULL')

def downgrade() -> None:
    op.drop_constraint('fk_backups_server_id', 'backups', type_='foreignkey')
    op.drop_column('backups', 'server_id')
    op.drop_column('users', 'role')
