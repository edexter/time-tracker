from datetime import datetime
from backend.extensions import db
import uuid


class LoginAttempt(db.Model):
    __tablename__ = 'login_attempts'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ip_address = db.Column(db.String(45), nullable=False)
    attempted_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    success = db.Column(db.Boolean, nullable=False, default=False)

    # Indexes
    __table_args__ = (
        db.Index('idx_login_attempts_ip_time', 'ip_address', 'attempted_at'),
    )

    def to_dict(self):
        """Convert login attempt to dictionary."""
        return {
            'id': self.id,
            'ip_address': self.ip_address,
            'attempted_at': self.attempted_at.isoformat(),
            'success': self.success
        }
