'use strict';

angular.module('labsome.site.hardware', [
    'labsome.site.labs'
]);

angular.module('labsome.site.hardware').service('clusterServersAssigner', function($rootScope, labObjects) {
    $rootScope.$on('labsome.objects_inventory_changed', function() {
        for (var i = 0; i < labObjects.byObjectType['builtin.server'].length; ++i) {
            var server = labObjects.byObjectType['builtin.server'][i];
            if (server.cluster_id) {
                var cluster = labObjects.byObjectId[server.cluster_id];
                if (cluster) {
                    if (angular.isUndefined(cluster.servers)) {
                        cluster.servers = [];
                    }
                    cluster.servers.push(server.id);
                }
            }
        }
    });
});

angular.module('labsome.site.hardware').controller('AddServerToClusterController', function($scope, $http, $state, labObjects) {
    $scope.add_to_cluster = function(cluster_id) {
        $http.put('/api/hardware/v1/builtin/server/' + $scope.object_id, {cluster_id: cluster_id}).then(function() {
            labObjects.refresh().then(function() {
                $state.go('^');
            });
        });
    };
});

angular.module('labsome.site.hardware').controller('RemoveServerFromClusterController', function($scope, $http, $state, labObjects) {
    $http.put('/api/hardware/v1/builtin/server/' + $scope.object_id, {cluster_id: null}).then(function() {
        labObjects.refresh().then(function() {
            $state.go('^');
        });
    });
});

angular.module('labsome.site.hardware').controller('DeleteClusterController', function($scope, $http, $q, $state, labObjects) {
    $scope.ok = function() {
        var cluster = labObjects.byObjectId[$scope.object_id];
        var unassign_promises = [];
        if (cluster.servers) {
            for (var i = 0; i < cluster.servers.length; ++i) {
                var server_id = cluster.servers[i];
                unassign_promises.push($http.put('/api/hardware/v1/builtin/server/' + server_id, {cluster_id: null}));
            }
        }
        $q.all(unassign_promises).then(function() {
            $http.delete('/api/hardware/v1/builtin/cluster/' + $scope.object_id).then(function() {
                labObjects.refresh().then(function() {
                    $state.go('^');
                });
            });
        });
    };
});

angular.module('labsome.site.hardware').controller('CreateClusterController', function($scope, $http, $state, labObjects) {
    $scope.cluster = {
        lab_id: $scope.lab_id
    };

    $scope.create = function() {
        $scope.working = true;
        $http.post('/api/hardware/v1/builtin/cluster', $scope.cluster).then(function() {
            labObjects.refresh().then(function() {
                $state.go('^');
            });
        });
    };
});

angular.module('labsome.site.hardware').run(function(clusterServersAssigner) {
});
