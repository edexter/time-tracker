from flask import Blueprint, request, jsonify
from backend.extensions import db
from backend.models.project import Project
from backend.models.time_allocation import TimeAllocation
from backend.middleware.auth_middleware import login_required
from decimal import Decimal

bp = Blueprint('projects', __name__, url_prefix='/api/projects')


@bp.route('', methods=['GET'])
@login_required
def get_projects():
    """Get all projects."""
    include_archived = request.args.get('include_archived', 'false').lower() == 'true'
    client_id = request.args.get('client_id')

    query = Project.query
    if not include_archived:
        query = query.filter_by(is_archived=False)
    if client_id:
        query = query.filter_by(client_id=client_id)

    projects = query.order_by(Project.created_at.desc()).all()
    return jsonify({
        'projects': [project.to_dict(include_hours_logged=True) for project in projects]
    }), 200


@bp.route('', methods=['POST'])
@login_required
def create_project():
    """Create a new project."""
    data = request.get_json()

    # Validate required fields
    required_fields = ['client_id', 'name']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'{field} is required'}), 400

    project = Project(
        client_id=data['client_id'],
        name=data['name'],
        hourly_rate_override=Decimal(str(data['hourly_rate_override'])) if data.get('hourly_rate_override') else None,
        hour_budget=Decimal(str(data['hour_budget'])) if data.get('hour_budget') else None
    )

    db.session.add(project)
    db.session.commit()

    return jsonify({'project': project.to_dict()}), 201


@bp.route('/<project_id>', methods=['GET'])
@login_required
def get_project(project_id):
    """Get a specific project."""
    project = Project.query.get_or_404(project_id)
    return jsonify({'project': project.to_dict(include_hours_logged=True)}), 200


@bp.route('/<project_id>', methods=['PUT'])
@login_required
def update_project(project_id):
    """Update a project."""
    project = Project.query.get_or_404(project_id)
    data = request.get_json()

    # Update allowed fields
    if 'name' in data:
        project.name = data['name']
    if 'hourly_rate_override' in data:
        project.hourly_rate_override = Decimal(str(data['hourly_rate_override'])) if data['hourly_rate_override'] else None
    if 'hour_budget' in data:
        project.hour_budget = Decimal(str(data['hour_budget'])) if data['hour_budget'] else None
    if 'is_active' in data:
        project.is_active = data['is_active']

    db.session.commit()
    return jsonify({'project': project.to_dict(include_hours_logged=True)}), 200


@bp.route('/<project_id>/archive', methods=['PUT'])
@login_required
def archive_project(project_id):
    """Archive a project."""
    project = Project.query.get_or_404(project_id)
    project.is_archived = True
    db.session.commit()
    return jsonify({'project': project.to_dict()}), 200


@bp.route('/<project_id>/restore', methods=['PUT'])
@login_required
def restore_project(project_id):
    """Restore an archived project."""
    project = Project.query.get_or_404(project_id)
    project.is_archived = False
    db.session.commit()
    return jsonify({'project': project.to_dict()}), 200


@bp.route('/<project_id>', methods=['DELETE'])
@login_required
def delete_project(project_id):
    """Delete a project (only if no time logged)."""
    project = Project.query.get_or_404(project_id)

    # Check if any time has been logged for this project
    has_time_logged = TimeAllocation.query.filter_by(project_id=project_id).count() > 0

    if has_time_logged:
        return jsonify({'error': 'Cannot delete project with logged time. Archive instead.'}), 400

    db.session.delete(project)
    db.session.commit()
    return '', 204
