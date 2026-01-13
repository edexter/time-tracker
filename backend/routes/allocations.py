from flask import Blueprint

bp = Blueprint('allocations', __name__, url_prefix='/api/allocations')


@bp.route('', methods=['GET'])
def get_allocations():
    """Get time allocations - to be implemented in Phase 4."""
    return {
        'allocations': [],
        'total_allocated': 0,
        'total_clocked': 0,
        'unallocated': 0
    }, 200


@bp.route('', methods=['POST'])
def create_allocation():
    """Create time allocation - to be implemented in Phase 4."""
    return {'message': 'Not yet implemented'}, 501
