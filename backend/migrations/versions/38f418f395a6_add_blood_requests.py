
"""add blood requests

Revision ID: 38f418f395a6
Revises: dff0c55ee586
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "38f418f395a6"
down_revision: Union[str, Sequence[str], None] = "dff0c55ee586"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create the blood requests table."""
    op.create_table(
        "blood_requests",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("hospital_id", sa.Integer(), nullable=False),
        sa.Column(
            "blood_group",
            sa.Enum(
                "A_POSITIVE", "A_NEGATIVE",
                "B_POSITIVE", "B_NEGATIVE",
                "AB_POSITIVE", "AB_NEGATIVE",
                "O_POSITIVE", "O_NEGATIVE",
                name="blood_request_blood_group",
            ),
            nullable=False,
        ),
        sa.Column("units_needed", sa.Integer(), nullable=False),
        sa.Column(
            "urgency",
            sa.Enum(
                "ROUTINE", "URGENT", "EMERGENCY",
                name="blood_request_urgency",
            ),
            nullable=False,
        ),
        sa.Column(
            "status",
            sa.Enum(
                "PENDING", "FULFILLED", "CANCELLED",
                name="blood_request_status",
            ),
            nullable=False,
        ),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("needed_by", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "units_needed > 0",
            name="ck_blood_requests_units_positive",
        ),
        sa.ForeignKeyConstraint(
            ["hospital_id"],
            ["hospitals.id"],
            ondelete="CASCADE",
        ),
    )

    op.create_index(
        "ix_blood_requests_id", "blood_requests", ["id"], unique=False
    )
    op.create_index(
        "ix_blood_requests_hospital_id",
        "blood_requests", ["hospital_id"], unique=False
    )
    op.create_index(
        "ix_blood_requests_blood_group",
        "blood_requests", ["blood_group"], unique=False
    )
    op.create_index(
        "ix_blood_requests_status",
        "blood_requests", ["status"], unique=False
    )


def downgrade() -> None:
    """Remove only the blood requests table."""
    op.drop_index("ix_blood_requests_status", table_name="blood_requests")
    op.drop_index("ix_blood_requests_blood_group", table_name="blood_requests")
    op.drop_index("ix_blood_requests_hospital_id", table_name="blood_requests")
    op.drop_index("ix_blood_requests_id", table_name="blood_requests")
    op.drop_table("blood_requests")
