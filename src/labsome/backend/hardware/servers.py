import httplib
import pkg_resources
from flask import request
from flask import Response
from flask import abort as flask_abort
from ..db.times import now
from .models import Lab
from .hardware_type import HardwareType

class ServerError(Exception):
    pass

HEARTBEAT_MANDATORY_FIELDS = ('name', 'lab_id')
HEARTBEAT_FORBIDDEN_FIELDS = ('id', 'type_key', 'status', 'last_heartbeat')

class Server(HardwareType):
    TYPE_VENDOR = 'builtin'
    TYPE_NAME = 'server'

    @classmethod
    def display_name(cls):
        return 'Server'

    @classmethod
    def register_api(cls, app_or_blueprint, url_prefix):
        @app_or_blueprint.route(url_prefix + '/code/agent.py')
        def get_agent_code():
            if 'lab_id' not in request.args:
                flask_abort(httplib.BAD_REQUEST, 'Missing lab_id argument')
            agent_code = pkg_resources.resource_string(__name__, 'agent.py.txt')
            agent_code = agent_code.replace('$$LABSOME_URL$$', request.url_root)
            agent_code = agent_code.replace('$$LABSOME_INTERVAL$$', '30')
            agent_code = agent_code.replace('$$LABSOME_LAB_ID$$', request.args['lab_id'])
            return Response(agent_code, status=httplib.OK, mimetype='application/x-python')

        @app_or_blueprint.route(url_prefix + '/code/heartbeat.py')
        def get_heartbeat_code():
            heartbeat_code = pkg_resources.resource_string(__name__, 'heartbeat.py.txt')
            return Response(heartbeat_code, status=httplib.OK, mimetype='application/x-python')

        @app_or_blueprint.route(url_prefix + '/heartbeat', methods=['POST'])
        def heartbeat_call():
            info = request.json
            if any(field in info for field in HEARTBEAT_FORBIDDEN_FIELDS):
                flask_abort(httplib.BAD_REQUEST, '{} heartbeats cannot contain the following fields: {}'.format(
                    cls.__name__, ', '.join(HEARTBEAT_FORBIDDEN_FIELDS)))
            if any(field not in info for field in HEARTBEAT_MANDATORY_FIELDS):
                flask_abort(httplib.BAD_REQUEST, '{} heartbeats must contain at least the following fields: {}'.format(
                    cls.__name__, ', '.join(HEARTBEAT_MANDATORY_FIELDS)))
            lab_id = info['lab_id']
            if Lab.query.get(lab_id) is None:
                flask_abort(httplib.NOT_FOUND, 'No lab with id={!r}'.format(lab_id))
            server = cls.get_by_name_and_lab(info['name'], lab_id)
            if server is None:
                server = cls.create(**info)
            else:
                server.update(**info)
            server.last_heartbeat = now()
            server.status = 'success' # XXX calculate this with a background job based on server.last_heartbeat
            server.save()
            return 'ok'
