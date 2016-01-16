import os
import sys
from flask import Flask
from flask import redirect
from flask import jsonify
from flask_jwt import _jwt_required
from flask_jwt import JWTError
from .logs import log_to_console
from .settings import database_config
from .settings import full_config
from .settings.models import get_settings
from . import auth
from . import db
from .db.json_encoder import CustomJSONEncoder
from .first_setup.api import first_setup_api
from .auth.api import auth_api
from .settings.api import settings_api
from .hardware.api import hardware_api
from .sio import socketio

def _ui_routes(app):
    @app.route('/')
    @app.route('/ui')
    def ui_redirect():
        return redirect('/ui/')

    @app.route('/ui/')
    @app.route('/ui/<path:path>')
    def ui(path=None):
        return app.send_static_file('index.html')

    @app.route('/api/state')
    def server_state():
        is_initialized = False
        is_authenticated = False
        if get_settings().is_initialized:
            is_initialized = True
            try:
                _jwt_required(app.config['JWT_DEFAULT_REALM']) # Refreshes current_identity, raises JWTError if no token exists
            except JWTError:
                pass
            else:
                is_authenticated = True
        return jsonify(dict(is_initialized=is_initialized, is_authenticated=is_authenticated))

def _first_setup_routes(app):
    app.register_blueprint(first_setup_api, url_prefix='/api/first-setup')

def _full_app_routes(app):
    app.register_blueprint(auth_api, url_prefix='/api/auth')
    app.register_blueprint(settings_api, url_prefix='/api/settings')
    app.register_blueprint(hardware_api, url_prefix='/api/hardware/v1')

def create_app():
    log_to_console()
    static_folder = os.environ.get('LABSOME_STATIC_FOLDER', '/opt/labsome/static')
    app = Flask(__name__, static_folder=static_folder)
    app.json_encoder = CustomJSONEncoder
    app.config.from_object(database_config())
    socketio.init_app(app)

    with app.app_context():
        db.init_app(app)
        app.config.from_object(full_config())
        auth.init_app(app)
        _ui_routes(app)
        if not get_settings().is_initialized:
            _first_setup_routes(app)
        else:
            _full_app_routes(app)

    return app
