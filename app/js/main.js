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
    .controller('MainCtrl', [
        '$scope',
        'posts',
        //'socket',
        function($scope, posts){
            $scope.gloveStatus = "Not Connected";
            $scope.messages = [];
            $scope.messages.push("Logging...");
            $scope.sendTestData = function() {
               $.get('/api/sendTestData', function(res) {
                });
            };
            socket.on('message_update', function(data) {
                console.log(data);
                $scope.messages.unshift(data);
                $scope.$apply();
            });
                
        }
    ]);
}());

