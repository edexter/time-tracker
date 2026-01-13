import bcrypt
from datetime import datetime, timedelta
from flask import current_app
from backend.extensions import db
from backend.models.login_attempt import LoginAttempt


class AuthService:
    """Service for handling authentication logic."""

    LOCKOUT_THRESHOLD = 10  # Failed attempts before lockout
    LOCKOUT_DURATION_MINUTES = 30
    RATE_LIMIT_WINDOW_MINUTES = 1
    RATE_LIMIT_MAX_ATTEMPTS = 5

    @staticmethod
    def verify_password(password: str) -> bool:
        """Verify password against stored hash."""
        password_hash = current_app.config.get('PASSWORD_HASH')
        if not password_hash:
            raise ValueError("PASSWORD_HASH not configured")

        password_bytes = password.encode('utf-8')
        hash_bytes = password_hash.encode('utf-8')

        return bcrypt.checkpw(password_bytes, hash_bytes)

    @staticmethod
    def check_rate_limit(ip_address: str) -> tuple[bool, int]:
        """
        Check if IP address has exceeded rate limit.

        Returns:
            (is_allowed, attempts_remaining)
        """
        window_start = datetime.utcnow() - timedelta(minutes=AuthService.RATE_LIMIT_WINDOW_MINUTES)

        recent_attempts = LoginAttempt.query.filter(
            LoginAttempt.ip_address == ip_address,
            LoginAttempt.attempted_at >= window_start
        ).count()

        attempts_remaining = max(0, AuthService.RATE_LIMIT_MAX_ATTEMPTS - recent_attempts)
        is_allowed = recent_attempts < AuthService.RATE_LIMIT_MAX_ATTEMPTS

        return is_allowed, attempts_remaining

    @staticmethod
    def check_lockout(ip_address: str) -> tuple[bool, int]:
        """
        Check if IP address is locked out due to failed attempts.

        Returns:
            (is_locked_out, minutes_remaining)
        """
        lockout_window = datetime.utcnow() - timedelta(minutes=AuthService.LOCKOUT_DURATION_MINUTES)

        failed_attempts = LoginAttempt.query.filter(
            LoginAttempt.ip_address == ip_address,
            LoginAttempt.success == False,
            LoginAttempt.attempted_at >= lockout_window
        ).count()

        if failed_attempts >= AuthService.LOCKOUT_THRESHOLD:
            # Find the oldest failed attempt in the window
            oldest_attempt = LoginAttempt.query.filter(
                LoginAttempt.ip_address == ip_address,
                LoginAttempt.success == False,
                LoginAttempt.attempted_at >= lockout_window
            ).order_by(LoginAttempt.attempted_at.asc()).first()

            if oldest_attempt:
                lockout_end = oldest_attempt.attempted_at + timedelta(minutes=AuthService.LOCKOUT_DURATION_MINUTES)
                minutes_remaining = int((lockout_end - datetime.utcnow()).total_seconds() / 60) + 1
                return True, max(0, minutes_remaining)

        return False, 0

    @staticmethod
    def record_login_attempt(ip_address: str, success: bool):
        """Record a login attempt in the database."""
        attempt = LoginAttempt(
            ip_address=ip_address,
            success=success
        )
        db.session.add(attempt)
        db.session.commit()

    @staticmethod
    def clear_failed_attempts(ip_address: str):
        """Clear failed login attempts for an IP address after successful login."""
        LoginAttempt.query.filter(
            LoginAttempt.ip_address == ip_address,
            LoginAttempt.success == False
        ).delete()
        db.session.commit()
