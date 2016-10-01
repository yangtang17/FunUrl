var app = angular.module('tinyurlApp', ['ngResource', 'ngRoute'])
.config(function($routeProvider) {
    $routeProvider
        .when('/', {
            templateUrl: '/public/views/home.html',
            controller: 'homeController'
        })
//        .when('/:shortUrl', {
//            templateUrl: '/public/views/url.html',
//            controller: 'redirectController'
//        })
        .when('/urls/:shortUrl', {
            templateUrl: '/public/views/url.html',
            controller: 'urlController'
        });
})
.config(function($locationProvider) {
    console.log("$locationProvider using html5Mode? ");
    console.log($locationProvider.html5Mode());
    console.log("$locationProvider has hash prefix? ");
    console.log($locationProvider.hashPrefix() + "empty!!!");

    $locationProvider.html5Mode(true);
});