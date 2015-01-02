(function() {
'use strict';

    //require('angular');
    //require('socket.io-client');
    
    var serverIP = "localhost";
    var socket = io.connect(serverIP + ':4000');
    console.log('socket connected to: ' + serverIP);

    angular.module('ManusDebug', ['ui.router'])
    .config(function ($stateProvider, $urlRouterProvider) {

        $urlRouterProvider.otherwise('/');

        $stateProvider
            .state('home', {
                url: '/',
                templateUrl: 'partials/partial-home.html',
                controller: 'MainCtrl'
            })
            .state('glove', {
                url: '/glove',
                templateUrl: 'partials/partial-glove.html'
            });
    })
    .factory('commands', ['$http', function($http){
        var o = {
            commands: []
        };
        o.getAll = function() {
            console.log('in getAll');
            return $http.get('/api/commands').success(function(data){
                var getKeys = function(obj){
                    var keys = [];
                    for(var key in obj){
                        keys.push(key);
                    }
                    return keys;
                };
                angular.copy(getKeys(data), o.commands);
            });
        };
        return o;
    }])
    .factory('gloveModel', ['$http', function($http){
        var o = {
        };
        o.getAll = function() {
            return $http.get('/api/gloveModel').success(function(data){
                console.log(data);
                angular.copy(data, o);
            });
        };
        return o;
    }])
    .controller('MainCtrl', [
        '$scope',
        'commands',
        'gloveModel',
        //'socket',
        function($scope, commands, gloveModel){
            commands.getAll();
            gloveModel.getAll();
            $scope.mode = "host";
            $scope.modeOptions = [ "host", "glove"];
            $scope.commands = commands.commands;
            $scope.myCommand = "";
            $scope.gloveStatus = "Not Connected";
            $scope.messages = [];
            $scope.messages.push("Logging...");
            $scope.gloveModel = gloveModel;         
            $scope.sendTestData = function() {
               $.get('/api/sendTestData/'+ $scope.mode + "/" + $scope.myCommand, function(res) {
                });
            };
            $scope.sendSync = function() {
                $.get('/api/sendSync/' + $scope.mode, function(res){
                });
            };

            $scope.connectBT = function() {
                $.get('/api/connectBT', function(res){

                });
            };

            $scope.disconnectBT = function() {
                $.get('/api/disconnectBT', function(res){

                });
            };

            socket.on('message_update', function(data) {
                console.log(data);
                $scope.$apply(function() {
                    $scope.messages.unshift(data);
                });
            });
            
        }
    ]);
}());

