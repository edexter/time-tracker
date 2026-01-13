from flask import Blueprint

bp = Blueprint('auth', __name__, url_prefix='/api/auth')


@bp.route('/login', methods=['POST'])
def login():
    """Login endpoint - to be implemented in Phase 2."""
    return {'message': 'Login endpoint - not yet implemented'}, 501


@bp.route('/logout', methods=['POST'])
def logout():
    """Logout endpoint - to be implemented in Phase 2."""
    return {'message': 'Logout endpoint - not yet implemented'}, 501


@bp.route('/me', methods=['GET'])
def me():
    """Check authentication status - to be implemented in Phase 2."""
    return {'authenticated': False}
