from flask import Blueprint

bp = Blueprint('reports', __name__, url_prefix='/api/reports')


@bp.route('/summary', methods=['GET'])
def get_summary():
    """Get billing summary report - to be implemented in Phase 6."""
    return {'message': 'Not yet implemented'}, 501


@bp.route('/daily-summary', methods=['GET'])
def get_daily_summary():
    """Get daily summary report - to be implemented in Phase 6."""
    return {'days': []}, 200
