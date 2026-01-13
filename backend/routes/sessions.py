from flask import Blueprint

bp = Blueprint('sessions', __name__, url_prefix='/api/sessions')


@bp.route('', methods=['GET'])
def get_sessions():
    """Get work sessions - to be implemented in Phase 4."""
    return {'sessions': [], 'total_hours': 0, 'active_session': None}, 200


@bp.route('/clock-in', methods=['POST'])
def clock_in():
    """Clock in - to be implemented in Phase 4."""
    return {'message': 'Not yet implemented'}, 501


@bp.route('/clock-out', methods=['POST'])
def clock_out():
    """Clock out - to be implemented in Phase 4."""
    return {'message': 'Not yet implemented'}, 501
