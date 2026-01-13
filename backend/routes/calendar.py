from flask import Blueprint

bp = Blueprint('calendar', __name__, url_prefix='/api/calendar')


@bp.route('', methods=['GET'])
def get_calendar():
    """Get calendar data - to be implemented in Phase 5."""
    return {'days': []}, 200
