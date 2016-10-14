angular.module('tinyurlApp')
    .controller('urlController', ['$scope', '$http', '$routeParams', function($scope, $http, $routeParams) {
        console.log('inside urlController');
        $http.get('/api/v1/urls/' + $routeParams.shortUrl)
            .success(function(data) {
                $scope.longUrl = data.longUrl;
                $scope.shortUrl = data.shortUrl;
                $scope.shortUrlToShow = 'http://localhost:8000/' + data.shortUrl;
            });

        $http.get('/api/v1/urls/' + $routeParams.shortUrl + '/totalClicks')
            .success(function(data) {
                $scope.totalClicks = data;
            });
    }]);
