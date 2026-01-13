import os
from flask import Flask, send_from_directory
from backend.config import config
from backend.extensions import db, migrate, limiter


def create_app(config_name=None):
    """Flask application factory."""
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')

    app = Flask(__name__, static_folder='static', static_url_path='')
    app.config.from_object(config[config_name])

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    limiter.init_app(app)

    # Import models (so migrations detect them)
    with app.app_context():
        from backend.models import client, project, work_session, time_allocation, login_attempt

    # Register blueprints
    from backend.routes import auth, clients, projects, sessions, allocations, reports, calendar
    app.register_blueprint(auth.bp)
    app.register_blueprint(clients.bp)
    app.register_blueprint(projects.bp)
    app.register_blueprint(sessions.bp)
    app.register_blueprint(allocations.bp)
    app.register_blueprint(reports.bp)
    app.register_blueprint(calendar.bp)

    # Serve React app for non-API routes
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_react(path):
        if path and os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        return send_from_directory(app.static_folder, 'index.html')

    return app


if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5000)
