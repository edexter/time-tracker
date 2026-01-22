from flask import Blueprint, request, jsonify
from datetime import datetime
from sqlalchemy import func, extract
from backend.extensions import db
from backend.models.time_allocation import TimeAllocation
from backend.models.project import Project
from backend.models.client import Client
from backend.middleware.auth_middleware import login_required

bp = Blueprint('reports', __name__, url_prefix='/api/reports')


@bp.route('/monthly-summary', methods=['GET'])
@login_required
def get_monthly_summary():
    """Get monthly summary report with hours and income by project."""
    year = request.args.get('year', type=int)
    month = request.args.get('month', type=int)

    if not year or not month:
        return {'error': 'Year and month parameters are required'}, 400

    # Query time allocations for the specified month
    results = db.session.query(
        Project.name.label('project_name'),
        Client.currency.label('currency'),
        func.sum(TimeAllocation.hours).label('total_hours'),
        Project.hourly_rate_override,
        Client.default_hourly_rate
    ).join(
        Project, TimeAllocation.project_id == Project.id
    ).join(
        Client, Project.client_id == Client.id
    ).filter(
        extract('year', TimeAllocation.date) == year,
        extract('month', TimeAllocation.date) == month
    ).group_by(
        Project.id,
        Project.name,
        Client.currency,
        Project.hourly_rate_override,
        Client.default_hourly_rate
    ).all()

    # Calculate income for each project
    report_data = []
    for row in results:
        effective_rate = float(row.hourly_rate_override) if row.hourly_rate_override else float(row.default_hourly_rate)
        total_hours = float(row.total_hours)
        income = total_hours * effective_rate

        report_data.append({
            'project_name': row.project_name,
            'hours': total_hours,
            'income': round(income, 2),
            'currency': row.currency
        })

    return jsonify(report_data), 200


@bp.route('/daily-hours', methods=['GET'])
@login_required
def get_daily_hours():
    """Get daily hours report with hours per project per day."""
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    if not start_date or not end_date:
        return {'error': 'start_date and end_date parameters are required'}, 400

    try:
        start = datetime.strptime(start_date, '%Y-%m-%d').date()
        end = datetime.strptime(end_date, '%Y-%m-%d').date()
    except ValueError:
        return {'error': 'Invalid date format. Use YYYY-MM-DD'}, 400

    # Query time allocations for the date range
    results = db.session.query(
        TimeAllocation.date,
        Project.name.label('project_name'),
        Client.name.label('client_name'),
        func.sum(TimeAllocation.hours).label('total_hours')
    ).join(
        Project, TimeAllocation.project_id == Project.id
    ).join(
        Client, Project.client_id == Client.id
    ).filter(
        TimeAllocation.date >= start,
        TimeAllocation.date <= end
    ).group_by(
        TimeAllocation.date,
        Project.id,
        Project.name,
        Client.id,
        Client.name
    ).order_by(
        TimeAllocation.date
    ).all()

    # Format results
    report_data = []
    for row in results:
        report_data.append({
            'date': row.date.isoformat(),
            'project_name': row.project_name,
            'client_name': row.client_name,
            'hours': float(row.total_hours)
        })

    return jsonify(report_data), 200


@bp.route('/summary', methods=['GET'])
def get_summary():
    """Get billing summary report - to be implemented in Phase 6."""
    return {'message': 'Not yet implemented'}, 501


@bp.route('/daily-summary', methods=['GET'])
@login_required
def get_daily_summary():
    """Get daily summary report with hours per project for a specific date."""
    date_str = request.args.get('date')

    if not date_str:
        # Default to today
        date_str = datetime.now().date().isoformat()

    try:
        target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        return {'error': 'Invalid date format. Use YYYY-MM-DD'}, 400

    # Query time allocations for the specific date
    results = db.session.query(
        Project.name.label('project_name'),
        func.sum(TimeAllocation.hours).label('total_hours')
    ).join(
        Project, TimeAllocation.project_id == Project.id
    ).filter(
        TimeAllocation.date == target_date
    ).group_by(
        Project.id,
        Project.name
    ).all()

    # Format results
    report_data = []
    for row in results:
        report_data.append({
            'project_name': row.project_name,
            'hours': float(row.total_hours)
        })

    return jsonify(report_data), 200
