'use strict';

angular.module('labsome.common', [
    'ui.router',
    'angular.filter',
    'ui.bootstrap',
    'ui.select',
    'ngSanitize',
    'slugifier'
]);

angular.module('labsome.common').run(function($rootScope, $state) {
    $rootScope.moment = moment;
    $rootScope.$state = $state;
    $rootScope.number = parseFloat;
});
