from datetime import datetime
from backend.extensions import db
import uuid


class Project(db.Model):
    __tablename__ = 'projects'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    client_id = db.Column(db.String(36), db.ForeignKey('clients.id'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    short_name = db.Column(db.String(50), nullable=True)
    hourly_rate_override = db.Column(db.Numeric(10, 2), nullable=True)
    hour_budget = db.Column(db.Numeric(10, 2), nullable=True)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    is_archived = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    client = db.relationship('Client', back_populates='projects')
    time_allocations = db.relationship('TimeAllocation', back_populates='project', lazy='dynamic')

    # Indexes
    __table_args__ = (
        db.Index('idx_projects_client', 'client_id'),
        db.Index('idx_projects_active', 'is_active', 'is_archived'),
    )

    def to_dict(self, include_hours_logged=False):
        """Convert project to dictionary."""
        effective_rate = self.hourly_rate_override if self.hourly_rate_override else self.client.default_hourly_rate

        data = {
            'id': self.id,
            'client_id': self.client_id,
            'client_name': self.client.name,
            'name': self.name,
            'short_name': self.short_name,
            'hourly_rate_override': float(self.hourly_rate_override) if self.hourly_rate_override else None,
            'effective_hourly_rate': float(effective_rate),
            'currency': self.client.currency,
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
        """Calculate total hours logged for this project."""
        from backend.models.time_allocation import TimeAllocation
        total = db.session.query(db.func.sum(TimeAllocation.hours)).filter(
            TimeAllocation.project_id == self.id
        ).scalar()
        return float(total) if total else 0.0
