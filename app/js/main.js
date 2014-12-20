(function() {
'use strict';

    require('angular');
    require('angular-route');
    require('angular-animate');
    //require('socket.io-client');
    
    var serverIP = "localhost";
    var socket = io.connect(serverIP + ':4000');
    console.log('socket connected to: ' + serverIP);

    angular.module('ManusDebug', [])
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
    .controller('MainCtrl', [
        '$scope',
        'commands',
        //'socket',
        function($scope, commands){
            commands.getAll();
            $scope.mode = "host";
            $scope.modeOptions = [ "host", "glove"];
            $scope.commands = commands.commands;
            $scope.myCommand = null;
            $scope.gloveStatus = "Not Connected";
            $scope.messages = [];
            $scope.messages.push("Logging...");
            $scope.sendTestData = function() {
               $.get('/api/sendTestData/'+ $scope.mode + "/" + $scope.myCommand, function(res) {
                });
            };
            $scope.sendSync = function() {
                $.get('/api/sendSync', function(res){

                });
            };

            $scope.connectBT = function() {
                $.get('/connectBT', function(res){

                });
            };

            $scope.disconnectBT = function() {
                $.get('/disconnectBT', function(res){

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

