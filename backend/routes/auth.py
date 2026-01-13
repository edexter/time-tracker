from flask import Blueprint, request, jsonify, session
from backend.services.auth_service import AuthService
from backend.extensions import limiter

bp = Blueprint('auth', __name__, url_prefix='/api/auth')


@bp.route('/login', methods=['POST'])
@limiter.limit("5 per minute")
def login():
    """Login endpoint with password verification and brute force protection."""
    data = request.get_json()
    password = data.get('password')

    if not password:
        return jsonify({'error': 'Password is required'}), 400

    ip_address = request.remote_addr

    # Check if IP is locked out
    is_locked_out, minutes_remaining = AuthService.check_lockout(ip_address)
    if is_locked_out:
        return jsonify({
            'error': f'Account locked due to too many failed attempts. Try again in {minutes_remaining} minutes.'
        }), 429

    # Check rate limit
    is_allowed, attempts_remaining = AuthService.check_rate_limit(ip_address)
    if not is_allowed:
        return jsonify({'error': 'Too many login attempts. Please try again later.'}), 429

    # Verify password
    try:
        if AuthService.verify_password(password):
            # Success - create session
            session.permanent = True
            session['authenticated'] = True

            # Record successful attempt and clear failed attempts
            AuthService.record_login_attempt(ip_address, success=True)
            AuthService.clear_failed_attempts(ip_address)

            return jsonify({'message': 'Login successful'}), 200
        else:
            # Failed - record attempt
            AuthService.record_login_attempt(ip_address, success=False)
            return jsonify({'error': 'Invalid password'}), 401
    except ValueError as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/logout', methods=['POST'])
def logout():
    """Logout endpoint - clears session."""
    session.clear()
    return jsonify({'message': 'Logout successful'}), 200


@bp.route('/me', methods=['GET'])
def me():
    """Check authentication status."""
    is_authenticated = session.get('authenticated', False)
    return jsonify({'authenticated': is_authenticated}), 200
