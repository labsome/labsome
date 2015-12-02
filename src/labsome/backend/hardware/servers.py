import httplib
import pkg_resources
from flask import Blueprint
from flask import request
from flask import Response
from flask import abort as flask_abort
from ..db.times import now
from .models import Lab
from .models import Type
from .models import Object

servers_api = Blueprint('servers_api', __name__)

@servers_api.route('/v1/code/agent.py')
def get_agent_code():
    if 'lab_id' not in request.args:
        flask_abort(httplib.BAD_REQUEST, 'Missing lab_id argument')
    agent_code = pkg_resources.resource_string(__name__, 'agent.py.txt')
    agent_code = agent_code.replace('$$LABSOME_URL$$', request.url_root)
    agent_code = agent_code.replace('$$LABSOME_INTERVAL$$', '30')
    agent_code = agent_code.replace('$$LABSOME_LAB_ID$$', request.args['lab_id'])
    return Response(agent_code, status=httplib.OK, mimetype='application/x-python')

@servers_api.route('/v1/code/heartbeat.py')
def get_heartbeat_code():
    heartbeat_code = pkg_resources.resource_string(__name__, 'heartbeat.py.txt')
    return Response(heartbeat_code, status=httplib.OK, mimetype='application/x-python')

class ServerError(Exception):
    pass

HEARTBEAT_MANDATORY_FIELDS = ('name', 'lab_id')
HEARTBEAT_FORBIDDEN_FIELDS = ('id', 'type_id', 'status', 'last_heartbeat')

def get_server_type():
    server_types = tuple(Type.get_all(['server'], index='name'))
    if len(server_types) == 0:
        server_type = Type(name='server')
        server_type.save()
    else:
        [server_type] = server_types
    return server_type

@servers_api.route('/v1/heartbeat', methods=['POST'])
def heartbeat_call():
    info = request.json
    if any(field in request.json for field in HEARTBEAT_FORBIDDEN_FIELDS):
        flask_abort(httplib.BAD_REQUEST, 'Server heartbeats cannot contain the following fields: {}'.format(', '.join(HEARTBEAT_FORBIDDEN_FIELDS)))
    if any(field not in request.json for field in HEARTBEAT_MANDATORY_FIELDS):
        flask_abort(httplib.BAD_REQUEST, 'Server heartbeats must contain at least the following fields: {}'.format(', '.join(HEARTBEAT_MANDATORY_FIELDS)))
    lab_id = request.json['lab_id']
    if Lab.get(lab_id) is None:
        flask_abort(httplib.NOT_FOUND, 'No lab with id={!r}'.format(lab_id))
    server_type = get_server_type()
    objs = tuple(Object.get_all([info['name'], server_type.id, lab_id], index='name_type_lab'))
    if len(objs) == 0:
        obj = Object(**info)
        obj.type_id = server_type.id
    elif len(objs) == 1:
        [obj] = objs
        obj.update(**info)
    else:
        raise ServerError('Found more than one server object with hostname={!r}'.format(info['name']))
    obj.last_heartbeat = now()
    obj.status = 'success' # XXX calculate this with a background job based on obj.last_heartbeat
    obj.save()
    return 'ok'
