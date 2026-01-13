from flask import Blueprint, request, jsonify
from datetime import datetime
from decimal import Decimal
from backend.extensions import db
from backend.models.time_allocation import TimeAllocation
from backend.models.work_session import WorkSession
from backend.middleware.auth_middleware import login_required

bp = Blueprint('allocations', __name__, url_prefix='/api/allocations')


def get_total_clocked_for_date(target_date):
    """Calculate total hours clocked for a specific date."""
    sessions = WorkSession.query.filter_by(date=target_date).all()
    return sum(s.get_duration_hours() for s in sessions)


def get_total_allocated_for_date(target_date):
    """Calculate total hours allocated for a specific date."""
    total = db.session.query(db.func.sum(TimeAllocation.hours)).filter_by(
        date=target_date
    ).scalar()
    return float(total) if total else 0.0


@bp.route('', methods=['GET'])
@login_required
def get_allocations():
    """Get time allocations for a specific date."""
    date_str = request.args.get('date')
    if not date_str:
        return jsonify({'error': 'date parameter is required (YYYY-MM-DD)'}), 400

    try:
        target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400

    allocations = TimeAllocation.query.filter_by(date=target_date).order_by(
        TimeAllocation.created_at
    ).all()

    total_allocated = get_total_allocated_for_date(target_date)
    total_clocked = get_total_clocked_for_date(target_date)
    unallocated = total_clocked - total_allocated

    return jsonify({
        'allocations': [a.to_dict() for a in allocations],
        'total_allocated': round(total_allocated, 2),
        'total_clocked': round(total_clocked, 2),
        'unallocated': round(unallocated, 2)
    }), 200


@bp.route('', methods=['POST'])
@login_required
def create_allocation():
    """Create a time allocation."""
    data = request.get_json()

    required_fields = ['date', 'project_id', 'hours']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'{field} is required'}), 400

    try:
        allocation_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400

    hours = Decimal(str(data['hours']))

    # Validate hours are in 0.25 increments
    if hours <= 0 or (hours * 4) % 1 != 0:
        return jsonify({'error': 'Hours must be positive and in 0.25 increments'}), 400

    # Check if allocation would exceed clocked time
    total_allocated = get_total_allocated_for_date(allocation_date)
    total_clocked = get_total_clocked_for_date(allocation_date)

    if total_allocated + float(hours) > total_clocked:
        return jsonify({
            'error': f'Cannot allocate {hours}h. Only {round(total_clocked - total_allocated, 2)}h remaining for this date.'
        }), 400

    allocation = TimeAllocation(
        date=allocation_date,
        project_id=data['project_id'],
        hours=hours,
        notes=data.get('notes')
    )

    db.session.add(allocation)
    db.session.commit()

    return jsonify({'allocation': allocation.to_dict()}), 201


@bp.route('/<allocation_id>', methods=['PUT'])
@login_required
def update_allocation(allocation_id):
    """Update a time allocation."""
    allocation = TimeAllocation.query.get_or_404(allocation_id)
    data = request.get_json()

    # Update hours if provided
    if 'hours' in data:
        new_hours = Decimal(str(data['hours']))

        # Validate hours are in 0.25 increments
        if new_hours <= 0 or (new_hours * 4) % 1 != 0:
            return jsonify({'error': 'Hours must be positive and in 0.25 increments'}), 400

        # Check if new allocation would exceed clocked time
        total_allocated = get_total_allocated_for_date(allocation.date)
        total_clocked = get_total_clocked_for_date(allocation.date)

        # Subtract old allocation and add new one
        new_total_allocated = total_allocated - float(allocation.hours) + float(new_hours)

        if new_total_allocated > total_clocked:
            return jsonify({
                'error': f'Cannot update to {new_hours}h. Would exceed clocked time for this date.'
            }), 400

        allocation.hours = new_hours

    # Update project if provided
    if 'project_id' in data:
        allocation.project_id = data['project_id']

    # Update notes if provided
    if 'notes' in data:
        allocation.notes = data['notes']

    db.session.commit()
    return jsonify({'allocation': allocation.to_dict()}), 200


@bp.route('/<allocation_id>', methods=['DELETE'])
@login_required
def delete_allocation(allocation_id):
    """Delete a time allocation."""
    allocation = TimeAllocation.query.get_or_404(allocation_id)

    db.session.delete(allocation)
    db.session.commit()

    return '', 204
