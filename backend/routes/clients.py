from flask import Blueprint, request, jsonify
from backend.extensions import db
from backend.models.client import Client
from backend.models.time_allocation import TimeAllocation
from backend.middleware.auth_middleware import login_required
from decimal import Decimal

bp = Blueprint('clients', __name__, url_prefix='/api/clients')


@bp.route('', methods=['GET'])
@login_required
def get_clients():
    """Get all clients."""
    include_archived = request.args.get('include_archived', 'false').lower() == 'true'

    query = Client.query
    if not include_archived:
        query = query.filter_by(is_archived=False)

    clients = query.order_by(Client.created_at.desc()).all()
    return jsonify({
        'clients': [client.to_dict(include_hours_logged=True) for client in clients]
    }), 200


@bp.route('', methods=['POST'])
@login_required
def create_client():
    """Create a new client."""
    data = request.get_json()

    # Validate required fields
    required_fields = ['name', 'currency', 'default_hourly_rate']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'{field} is required'}), 400

    # Validate currency
    if data['currency'] not in ['CHF', 'EUR']:
        return jsonify({'error': 'Currency must be CHF or EUR'}), 400

    client = Client(
        name=data['name'],
        short_name=data.get('short_name'),
        currency=data['currency'],
        default_hourly_rate=Decimal(str(data['default_hourly_rate'])),
        hour_budget=Decimal(str(data['hour_budget'])) if data.get('hour_budget') else None
    )

    db.session.add(client)
    db.session.commit()

    return jsonify({'client': client.to_dict()}), 201


@bp.route('/<client_id>', methods=['GET'])
@login_required
def get_client(client_id):
    """Get a specific client."""
    client = Client.query.get_or_404(client_id)
    return jsonify({'client': client.to_dict(include_hours_logged=True)}), 200


@bp.route('/<client_id>', methods=['PUT'])
@login_required
def update_client(client_id):
    """Update a client."""
    client = Client.query.get_or_404(client_id)
    data = request.get_json()

    # Update allowed fields
    if 'name' in data:
        client.name = data['name']
    if 'short_name' in data:
        client.short_name = data['short_name']
    if 'currency' in data:
        if data['currency'] not in ['CHF', 'EUR']:
            return jsonify({'error': 'Currency must be CHF or EUR'}), 400
        client.currency = data['currency']
    if 'default_hourly_rate' in data:
        client.default_hourly_rate = Decimal(str(data['default_hourly_rate']))
    if 'hour_budget' in data:
        client.hour_budget = Decimal(str(data['hour_budget'])) if data['hour_budget'] else None
    if 'is_active' in data:
        client.is_active = data['is_active']

    db.session.commit()
    return jsonify({'client': client.to_dict(include_hours_logged=True)}), 200


@bp.route('/<client_id>/archive', methods=['PUT'])
@login_required
def archive_client(client_id):
    """Archive a client."""
    client = Client.query.get_or_404(client_id)
    client.is_archived = True
    db.session.commit()
    return jsonify({'client': client.to_dict()}), 200


@bp.route('/<client_id>/restore', methods=['PUT'])
@login_required
def restore_client(client_id):
    """Restore an archived client."""
    client = Client.query.get_or_404(client_id)
    client.is_archived = False
    db.session.commit()
    return jsonify({'client': client.to_dict()}), 200


@bp.route('/<client_id>', methods=['DELETE'])
@login_required
def delete_client(client_id):
    """Delete a client (only if no time logged)."""
    client = Client.query.get_or_404(client_id)

    # Check if any time has been logged for projects under this client
    has_time_logged = db.session.query(TimeAllocation).join(
        TimeAllocation.project
    ).filter_by(client_id=client_id).count() > 0

    if has_time_logged:
        return jsonify({'error': 'Cannot delete client with logged time. Archive instead.'}), 400

    db.session.delete(client)
    db.session.commit()
    return '', 204
