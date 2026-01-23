from datetime import datetime, timezone
from backend.extensions import db
import uuid


class Client(db.Model):
    __tablename__ = 'clients'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(255), nullable=False)
    short_name = db.Column(db.String(50), nullable=True)
    currency = db.Column(db.String(3), nullable=False)
    default_hourly_rate = db.Column(db.Numeric(10, 2), nullable=False)
    hour_budget = db.Column(db.Numeric(10, 2), nullable=True)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    is_archived = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    projects = db.relationship('Project', back_populates='client', lazy='dynamic')

    # Indexes
    __table_args__ = (
        db.CheckConstraint("currency IN ('CHF', 'EUR')", name='check_currency'),
        db.Index('idx_clients_active', 'is_active', 'is_archived'),
    )

    def to_dict(self, include_hours_logged=False):
        """Convert client to dictionary."""
        data = {
            'id': self.id,
            'name': self.name,
            'short_name': self.short_name,
            'currency': self.currency,
            'default_hourly_rate': float(self.default_hourly_rate),
            'hour_budget': float(self.hour_budget) if self.hour_budget else None,
            'is_active': self.is_active,
            'is_archived': self.is_archived,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

        if include_hours_logged:
            data['hours_logged'] = self.get_hours_logged()

        return data

    def get_hours_logged(self):
        """Calculate total hours logged for this client across all projects."""
        from backend.models.time_allocation import TimeAllocation
        from backend.models.project import Project
        total = db.session.query(db.func.sum(TimeAllocation.hours)).join(
            Project
        ).filter(
            Project.client_id == self.id
        ).scalar()
        return float(total) if total else 0.0
