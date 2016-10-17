angular.module('tinyurlApp')
    .controller('homeController', ['$scope', '$http', '$location', function($scope, $http, $location) {
        $scope.urlType = 'alphaNum';


        $scope.submit = function() {
            $http.post('/api/v1/urls', {
                longUrl: $scope.longUrl,
                urlType: $scope.urlType
            }).success(function(data) {
                $location.path('/urls/' + data.shortUrl);
            });
        }
    }]);
