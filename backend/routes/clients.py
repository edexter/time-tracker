from flask import Blueprint

bp = Blueprint('clients', __name__, url_prefix='/api/clients')


@bp.route('', methods=['GET'])
def get_clients():
    """Get all clients - to be implemented in Phase 3."""
    return {'clients': []}, 200


@bp.route('', methods=['POST'])
def create_client():
    """Create client - to be implemented in Phase 3."""
    return {'message': 'Not yet implemented'}, 501
