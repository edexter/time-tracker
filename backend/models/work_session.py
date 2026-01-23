from datetime import datetime
from backend.extensions import db
from backend.utils.datetime_utils import ensure_naive, now_naive
import uuid


class WorkSession(db.Model):
    __tablename__ = 'work_sessions'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.DateTime(timezone=False), nullable=False)
    end_time = db.Column(db.DateTime(timezone=False), nullable=True)
    created_at = db.Column(db.DateTime(timezone=False), default=now_naive)
    updated_at = db.Column(db.DateTime(timezone=False), default=now_naive, onupdate=now_naive)

    # Indexes
    __table_args__ = (
        db.Index('idx_sessions_date', 'date'),
    )

    def to_dict(self) -> dict:
        """Convert work session to dictionary."""
        start = ensure_naive(self.start_time)
        end = ensure_naive(self.end_time)
        is_active = end is None
        duration = None if is_active else (end - start).total_seconds() / 3600

        return {
            'id': self.id,
            'date': self.date.isoformat(),
            'start_time': start.isoformat(),
            'end_time': end.isoformat() if end else None,
            'duration_hours': round(duration, 2) if duration else None,
            'is_active': is_active
        }

    def get_duration_hours(self):
        """Get duration in hours. Returns 0 for active sessions."""
        if self.end_time is None:
            return 0.0
        duration_seconds = (self.end_time - self.start_time).total_seconds()
        return duration_seconds / 3600
