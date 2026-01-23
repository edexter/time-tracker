from flask import Blueprint, request, jsonify
from datetime import datetime
from sqlalchemy import and_, or_
from backend.extensions import db
from backend.models.work_session import WorkSession
from backend.middleware.auth_middleware import login_required
from backend.utils.datetime_utils import parse_datetime_naive, ensure_naive, now_naive

bp = Blueprint('sessions', __name__, url_prefix='/api/sessions')


def check_overlap(start_time, end_time, session_date, exclude_session_id=None):
    """
    Check if a session overlaps with any existing sessions on the same date.
    Returns True if there's an overlap, False otherwise.
    """
    query = WorkSession.query.filter(WorkSession.date == session_date)

    if exclude_session_id:
        query = query.filter(WorkSession.id != exclude_session_id)

    # Check for overlaps:
    # Two sessions overlap if:
    # (start1 < end2) AND (end1 > start2)
    # For active sessions (end_time is None), we need special handling

    if end_time:
        # Completed session - check against all sessions
        overlap = query.filter(
            or_(
                # Overlaps with completed sessions
                and_(
                    WorkSession.end_time.isnot(None),
                    WorkSession.start_time < end_time,
                    WorkSession.end_time > start_time
                ),
                # Overlaps with active sessions
                and_(
                    WorkSession.end_time.is_(None),
                    WorkSession.start_time < end_time
                )
            )
        ).first()
    else:
        # Active session - check against all sessions
        overlap = query.filter(
            or_(
                # Overlaps with completed sessions
                and_(
                    WorkSession.end_time.isnot(None),
                    WorkSession.end_time > start_time
                ),
                # Overlaps with other active sessions
                WorkSession.end_time.is_(None)
            )
        ).first()

    return overlap is not None


@bp.route('', methods=['GET'])
@login_required
def get_sessions():
    """Get work sessions for a specific date."""
    date_str = request.args.get('date')
    if not date_str:
        return jsonify({'error': 'date parameter is required (YYYY-MM-DD)'}), 400

    try:
        target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400

    sessions = WorkSession.query.filter_by(date=target_date).order_by(WorkSession.start_time).all()

    # Calculate completed hours (active sessions return 0 from get_duration_hours)
    completed_hours = sum(s.get_duration_hours() for s in sessions)

    # Find active session
    active_session = next((s for s in sessions if s.end_time is None), None)

    return jsonify({
        'sessions': [s.to_dict() for s in sessions],
        'completed_hours': round(completed_hours, 2),
        'active_session': active_session.to_dict() if active_session else None
    }), 200


@bp.route('/clock-in', methods=['POST'])
@login_required
def clock_in():
    """Clock in - start a new work session."""
    data = request.get_json() or {}

    # Check if already clocked in
    active_session = WorkSession.query.filter_by(end_time=None).first()
    if active_session:
        return jsonify({'error': 'Already clocked in. Clock out first.'}), 400

    # Use provided time or current time (store as naive datetime in user's local timezone)
    if data.get('time'):
        start_time = parse_datetime_naive(data['time'])
    else:
        start_time = now_naive()

    session_date = start_time.date()

    # Check for overlaps
    if check_overlap(start_time, None, session_date):
        return jsonify({'error': 'This session overlaps with an existing session'}), 400

    session = WorkSession(
        date=session_date,
        start_time=start_time,
        end_time=None
    )

    db.session.add(session)
    db.session.commit()

    return jsonify({'session': session.to_dict()}), 201


@bp.route('/clock-out', methods=['POST'])
@login_required
def clock_out():
    """Clock out - end the active work session."""
    data = request.get_json() or {}

    # Find active session
    active_session = WorkSession.query.filter_by(end_time=None).first()
    if not active_session:
        return jsonify({'error': 'Not clocked in. Clock in first.'}), 400

    # Use provided time or current time (store as naive datetime in user's local timezone)
    if data.get('time'):
        end_time = parse_datetime_naive(data['time'])
    else:
        end_time = now_naive()

    # Validate end time is after start time
    start_time_naive = ensure_naive(active_session.start_time)
    if end_time <= start_time_naive:
        return jsonify({'error': 'End time must be after start time'}), 400

    # Check for overlaps (excluding the current session being updated)
    if check_overlap(active_session.start_time, end_time, active_session.date, active_session.id):
        return jsonify({'error': 'This session overlaps with an existing session'}), 400

    active_session.end_time = end_time
    db.session.commit()

    return jsonify({'session': active_session.to_dict()}), 200


@bp.route('', methods=['POST'])
@login_required
def create_session():
    """Create a manual work session."""
    data = request.get_json()

    required_fields = ['date', 'start_time', 'end_time']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'{field} is required'}), 400

    try:
        session_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        start_time = parse_datetime_naive(data['start_time'])
        end_time = parse_datetime_naive(data['end_time'])
    except ValueError as e:
        return jsonify({'error': f'Invalid date/time format: {str(e)}'}), 400

    # Validate end time is after start time
    if end_time <= start_time:
        return jsonify({'error': 'End time must be after start time'}), 400

    # Check for overlaps
    if check_overlap(start_time, end_time, session_date):
        return jsonify({'error': 'This session overlaps with an existing session'}), 400

    session = WorkSession(
        date=session_date,
        start_time=start_time,
        end_time=end_time
    )

    db.session.add(session)
    db.session.commit()

    return jsonify({'session': session.to_dict()}), 201


@bp.route('/<session_id>', methods=['PUT'])
@login_required
def update_session(session_id):
    """Update a work session."""
    session = WorkSession.query.get_or_404(session_id)
    data = request.get_json()

    if 'start_time' in data:
        try:
            session.start_time = parse_datetime_naive(data['start_time'])
        except ValueError:
            return jsonify({'error': 'Invalid start_time format'}), 400

    if 'end_time' in data:
        try:
            session.end_time = parse_datetime_naive(data['end_time'])
        except ValueError:
            return jsonify({'error': 'Invalid end_time format'}), 400

    # Validate end time is after start time
    if session.end_time and session.end_time <= session.start_time:
        return jsonify({'error': 'End time must be after start time'}), 400

    # Check for overlaps (excluding the current session being updated)
    if check_overlap(session.start_time, session.end_time, session.date, session.id):
        return jsonify({'error': 'This session overlaps with an existing session'}), 400

    db.session.commit()
    return jsonify({'session': session.to_dict()}), 200


@bp.route('/<session_id>', methods=['DELETE'])
@login_required
def delete_session(session_id):
    """Delete a work session."""
    session = WorkSession.query.get_or_404(session_id)

    db.session.delete(session)
    db.session.commit()

    return '', 204
