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


        var renderChart = function(chart, infos) {
            $scope[chart + 'Labels'] = [];
            $scope[chart + 'Data'] = [];

            $http.get('/api/v1/urls/' + $routeParams.shortUrl + '/' + infos)
                .success(function(data) {
                    data.forEach(function(info) {
                        $scope[chart + 'Labels'].push(info._id);
                        $scope[chart + 'Data'].push(info.count);
                    });
                });
        };

        renderChart("doughnut", "referer");
        renderChart("pie", "country");
        renderChart("base", "platform");
        renderChart("bar", "browser");
    }]);
