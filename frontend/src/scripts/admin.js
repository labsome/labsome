'use strict';

angular.module('warehaus.admin', ['warehaus.ui_helpers']);

angular.module('warehaus.admin').provider('adminView', function(viewPath) {
    return {
        $get: function() {
            return function(uri) {
                return viewPath('main-site/views/admin/' + uri);
            };
        }
    };
});

angular.module('warehaus.admin').provider('adminUrlRoutes', function(adminViewProvider) {
    var adminView = adminViewProvider.$get();

    var admin_url_routes = {
        name: 'admin',
        url: '/admin',
        views: {
            '': {
                templateUrl: adminView('index.html'),
                controller: 'AdminController',
            },
            'nav': {
                template: '<a ui-sref="labs"><i class="fa fa-angle-left"> </i> Back</a>'
            }
        },
        autoRedirectToChild: 'users',
        resolve: {
            $title: function() {
                return 'Admin';
            }
        },
        children: [
            {
                name: 'users',
                url: '/users?id',
                templateUrl: adminView('users.html'),
                controller: 'UsersAdminController',
                resolve: {
                    $title: function() {
                        return 'Users';
                    }
                }
            },
            {
                name: 'auth',
                url: '/auth',
                templateUrl: adminView('auth.html'),
                controller: 'AuthenticationAdminController',
                autoRedirectToChild: 'local',
                resolve: {
                    $title: function() {
                        return 'Authentication';
                    }
                },
                children: [
                    {
                        name: 'local',
                        url: '/local',
                        templateUrl: adminView('auth-local.html'),
                        controller: 'LocalAuthBackendController',
                        resolve: {
                            $title: function() {
                                return 'Local';
                            }
                        }
                    },
                    {
                        name: 'google',
                        url: '/google',
                        templateUrl: adminView('auth-google.html'),
                        controller: 'GoogleAuthBackendController',
                        resolve: {
                            $title: function() {
                                return 'Google';
                            }
                        }
                    },
                    {
                        name: 'ldap',
                        url: '/ldap',
                        templateUrl: adminView('auth-ldap.html'),
                        controller: 'LDAPAuthBackendController',
                        resolve: {
                            $title: function() {
                                return 'LDAP';
                            }
                        }
                    }
                ]
            }
        ]
    };

    return {
        $get: function() {
            return admin_url_routes;
        }
    };
});

angular.module('warehaus.admin').config(function(urlRegisterProvider, adminUrlRoutesProvider) {
    urlRegisterProvider.$get()(adminUrlRoutesProvider.$get());
});

angular.module('warehaus.admin').controller('AdminController', function($scope, $location, curUser) {
    $scope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
        if (toState.parent && !curUser.is_admin) {
            $location.url('/admin');
        }
    });
});

angular.module('warehaus.admin').controller('UsersAdminController', function($scope, $stateParams) {
    $scope.selected_user_id = $stateParams.id;
});

angular.module('warehaus.admin').controller('AuthenticationAdminController', function($scope) {
});

angular.module('warehaus.admin').service('createNewUser', function($uibModal, adminView) {
    return function() {
        $uibModal.open({
            templateUrl: adminView('create-user.html'),
            controller: 'CreateNewUserController'
        });
    };
});

angular.module('warehaus.admin').controller('CreateNewUserController', function($scope, $http, $uibModalInstance) {
    $scope.user = {};

    var creation_failed = function(res) {
        $scope.working = false;
        if (angular.isDefined(res.data.message)) {
            $scope.error = res.data.message;
        } else {
            $scope.error = res.data;
        }
    };

    $scope.save = function() {
        $scope.working = true;
        $http.post('/api/auth/users', $scope.user).then($uibModalInstance.close, creation_failed);
    };

    $scope.cancel = function() {
        $uibModalInstance.dismiss('cancel');
    };
});

angular.module('warehaus.admin').controller('LocalAuthBackendController', function($scope, users, createNewUser) {
    $scope.users = users;
    $scope.createNewUser = createNewUser;
});

angular.module('warehaus.admin').controller('GoogleAuthBackendController', function($scope) {
});

angular.module('warehaus.admin').controller('LDAPAuthBackendController', function($scope, $http) {
    $scope.working = true;

    var _update_from_res = function(res) {
        $scope.working = false;
        $scope.settings = {
            ldap: res.data
        };
    };

    $http.get('/api/v1/settings/ldap').then(_update_from_res);

    $scope.save_settings = function() {
        $scope.working = true;
        $http.post('/api/v1/settings/ldap', $scope.settings.ldap).then(_update_from_res);
    };
});
