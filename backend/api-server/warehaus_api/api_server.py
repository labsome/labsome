from argparse import ArgumentParser
from gevent.wsgi import WSGIServer
from .app import create_app_with_console_logging

def main():
    parser = ArgumentParser()
    parser.add_argument('-d', '--debug', default=False, action='store_true',
                        help='Run the server in debug mode')
    parser.add_argument('-H', '--host', default='0.0.0.0',
                        help='Hostname to listen on')
    parser.add_argument('-p', '--port', default=5000, type=int,
                        help='Port to listen on')
    args = parser.parse_args()
    app = create_app_with_console_logging()
    http_server = WSGIServer((args.host, args.port), app)
    http_server.serve_forever()

if __name__ == '__main__':
    main()
