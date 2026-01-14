from datetime import datetime
from backend.extensions import db
import uuid


class WorkSession(db.Model):
    __tablename__ = 'work_sessions'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.DateTime(timezone=False), nullable=False)
    end_time = db.Column(db.DateTime(timezone=False), nullable=True)
    created_at = db.Column(db.DateTime(timezone=False), default=datetime.utcnow)
    updated_at = db.Column(db.DateTime(timezone=False), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Indexes
    __table_args__ = (
        db.Index('idx_sessions_date', 'date'),
    )

    def to_dict(self):
        """Convert work session to dictionary."""
        duration = None
        is_active = self.end_time is None

        if not is_active:
            duration = (self.end_time - self.start_time).total_seconds() / 3600

        return {
            'id': self.id,
            'date': self.date.isoformat(),
            'start_time': self.start_time.isoformat(),
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'duration_hours': round(duration, 2) if duration else None,
            'is_active': is_active
        }

    def get_duration_hours(self):
        """Get duration in hours."""
        if self.end_time is None:
            return 0.0
        duration_seconds = (self.end_time - self.start_time).total_seconds()
        return duration_seconds / 3600
