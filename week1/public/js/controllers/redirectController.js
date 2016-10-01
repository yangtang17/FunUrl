angular.module('tinyurlApp')
.controller('redirectController', ['$http', '$routeParams', function($http, $routeParams) {
    console.log('inside redirectController');
    $http.get('/' + $routeParams.shortUrl)
        .success(function (data) {
            console.log("redirecting to: " + data.longUrl);
        });
}]);