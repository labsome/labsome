'use strict';

angular.module('warehaus.socketio', ['btford.socket-io']);

angular.module('warehaus.socketio').service('socketIoManager', function($rootScope, $log, socketFactory, authToken, getAuthToken) {
    var socket;

    $rootScope.$on('warehaus.auth.user_authorized', function() {
        if (angular.isDefined(socket)) {
            return;
        }
        $log.info('Creating new socketio');
        socket = socketFactory();
        socket.on('connect', function() {
            $log.debug('Socketio connected');
            socket.on('authenticated', function () {
                $log.debug('Socketio authenticated');
                $rootScope.$broadcast('warehaus.socketio.new_socket_available', socket);
            });
            socket.on('error', $log.error);
            socket.on('unauthorized', function(error) {
                if (error.data.type === 'UnauthorizedError') {
                    $log.info('Unauthorized from socketio');
                    authToken.discard();
                }
            });
            socket.emit('authenticate', { token: getAuthToken() });
        });
    });

    $rootScope.$on('warehaus.auth.user_unauthorized', function() {
        if (angular.isUndefined(socket)) {
            return;
        }
        $log.info('Disconnecting socketio');
        socket.removeAllListeners();
        socket.disconnect();
        socket = undefined;
    });
});

angular.module('warehaus.socketio').service('getObjectNotifications', function($rootScope) {
    return function(table_name, options) {
        $rootScope.$on('warehaus.socketio.new_socket_available', function(event, socket) {
            if (options.on_changed) {
                socket.on('object_changed:' + table_name, options.on_changed);
            }
            if (options.on_deleted) {
                socket.on('object_deleted:' + table_name, options.on_deleted);
            }
            if (options.on_new_socket) {
                options.on_new_socket();
            }
        });
    };
});
