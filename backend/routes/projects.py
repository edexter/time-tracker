from flask import Blueprint

bp = Blueprint('projects', __name__, url_prefix='/api/projects')


@bp.route('', methods=['GET'])
def get_projects():
    """Get all projects - to be implemented in Phase 3."""
    return {'projects': []}, 200


@bp.route('', methods=['POST'])
def create_project():
    """Create project - to be implemented in Phase 3."""
    return {'message': 'Not yet implemented'}, 501
