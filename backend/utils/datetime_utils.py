"""
Datetime utilities for consistent timezone handling.

This project stores all user-facing datetimes as naive local time (no timezone info).
These utilities ensure consistent parsing and formatting across the codebase.
"""
from datetime import datetime


def parse_datetime_naive(iso_string: str) -> datetime:
    """
    Parse an ISO datetime string to a naive datetime.

    Handles both timezone-aware (with 'Z' or offset) and naive ISO strings,
    always returning a naive datetime for storage.
    """
    # Remove 'Z' suffix if present (indicates UTC)
    cleaned = iso_string.replace('Z', '')
    dt = datetime.fromisoformat(cleaned)
    # Strip any timezone info to store as naive local time
    return dt.replace(tzinfo=None)


def ensure_naive(dt: datetime) -> datetime:
    """
    Ensure a datetime is naive (no timezone info).

    Returns the datetime unchanged if already naive, otherwise strips tzinfo.
    """
    if dt is None:
        return None
    if dt.tzinfo is not None:
        return dt.replace(tzinfo=None)
    return dt


def now_naive() -> datetime:
    """Return current time as naive datetime."""
    return datetime.now()
