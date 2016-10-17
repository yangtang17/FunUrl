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

        // base chart (platforms) starts x-axis tick from zero
        $scope.baseOptions = {
            scales: {
                xAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            }
        };

        // bar chart (browsers) starts y-axis tick from zero
        $scope.barOptions = {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            }
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

        // line chart (clicks) showing series ('Clicks:') when hovering
        $scope.lineSeries = ['Clicks: '];

        // line options for different x scale
        var timeOptions = {};
        timeOptions.hour = {
            unit: 'minute',
            unitStepSize: 15,
            round: 'minute',
            tooltipFormat: 'h:mm a',
            displayFormats: {
                minute: 'h:mm a'
            }
        };

        timeOptions.day = {
            unit: 'hour',
            unitStepSize: 4,
            round: 'hour',
            tooltipFormat: 'MMM D, hA',
            displayFormats: {
                hour: 'MMM D, hA'
            }
        };

        timeOptions.month = {
            unit: 'day',
            unitStepSize: 5, // do NOT use 7, causing overlapped labels
            round: 'day',
            tooltipFormat: 'MMM D, YYYY',
            displayFormats: {
                day: 'MMM D, YYYY'
            }
        };

        $scope.lineOptions = {
            scales: {
                xAxes: [{
                    type: 'time',
                    time: timeOptions.hour
                }]
            }
        };

        $scope.getTime = function(time) {
            $scope.lineLabels = [];
            // ensure lineData is 2D array to display hover effect correctly
            $scope.lineData = [];
            $scope.lineData.push([]);

            $scope.time = time;

            $scope.lineOptions.scales.xAxes[0].time = timeOptions[time];


            $http.get('/api/v1/urls/' + $routeParams.shortUrl + '/' + time)
                .success(function(data) {
                    data.forEach(function(item) {
                        // note: item.time is a string, NOT a Date object
                        // directly pushing in item.time will cause ERROR!!!
                        $scope.lineLabels.push(new Date(item.time));
                        // console.log(item.time + ':  ' + item.count);
                        $scope.lineData[0].push(item.count);
                    });
                });
        };

        $scope.getTime($scope.time);

    }]);
