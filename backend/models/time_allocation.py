from datetime import datetime
from backend.extensions import db
import uuid


class TimeAllocation(db.Model):
    __tablename__ = 'time_allocations'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    date = db.Column(db.Date, nullable=False)
    project_id = db.Column(db.String(36), db.ForeignKey('projects.id'), nullable=False)
    hours = db.Column(db.Numeric(5, 2), nullable=False)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    project = db.relationship('Project', back_populates='time_allocations')

    # Indexes and constraints
    __table_args__ = (
        db.Index('idx_allocations_date', 'date'),
        db.Index('idx_allocations_project', 'project_id'),
    )

    def to_dict(self):
        """Convert time allocation to dictionary."""
        return {
            'id': self.id,
            'date': self.date.isoformat(),
            'project_id': self.project_id,
            'project_name': self.project.name,
            'client_name': self.project.client.name,
            'hours': float(self.hours),
            'notes': self.notes,
            'created_at': self.created_at.isoformat()
        }
