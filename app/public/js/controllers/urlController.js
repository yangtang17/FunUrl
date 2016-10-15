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


            // line chart (clicks) showing series ('Clicks:') when hovering
            $scope.lineSeries = ['Clicks: '];
            // line x-axis label skip
            $scope.lineOptions = {
                showXLabels: 3
            };
            // base chart (platforms) starts y-axis tick from zero
            $scope.baseOptions = {
                scales: {
                    xAxes: [{
                        ticks: {
                            beginAtZero: true
                        }
                    }]
                }
            };
        };

        renderChart("doughnut", "referer");
        renderChart("pie", "country");
        renderChart("base", "platform");
        renderChart("bar", "browser");

        // variables to pass string in getTime(time) from HTML
        $scope.hour = 'hour';
        $scope.day = 'day';
        $scope.month = 'month';

        // has three values: 'hour', 'day', 'year'
        $scope.time = $scope.hour;

        $scope.getTime = function(time) {
            $scope.lineLabels = [];
            // ensure lineData is 2D array to display hover effect correctly
            $scope.lineData = [];
            $scope.lineData.push([]);

            $scope.time = time;

            $http.get('/api/v1/urls/' + $routeParams.shortUrl + '/' + time)
                .success(function(data) {
                    data.forEach(function(item) {
                        var legend = '';
                        if (time === 'hour') {
                            if (item._id.minutes < 10) {
                                item._id.minutes = '0' + item._id.minutes;
                            }
                            var minuteLabels = ['00', '15', '30', '45'];
                            if (minuteLabels.includes('' + item._id.minutes)) {
                                legend = item._id.hour + ':' + item._id.minutes;
                            }
                        }
                        if (time === 'day') {
                            var hourLabels = [0, 4, 8, 12, 16, 20];
                            if (hourLabels.includes(item._id.hour)) {
                                legend = item._id.hour + ':00';
                            }
                        }
                        if (time === 'month') {
                            var dayLabels = [1, 8, 15, 22, 29];
                            if (dayLabels.includes(item._id.day)) {
                                legend = item._id.month + '/' + item._id.day;
                            }

                        }
                        $scope.lineLabels.push(legend);
                        $scope.lineData[0].push(item.count);
                    });
                });
        }

        $scope.getTime($scope.time);

    }]);
