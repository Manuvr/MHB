(function() {
'use strict';

    require('angular');
    require('angular-route');
    require('angular-animate');
    //require('socket.io-client');
    
    var serverIP = "localhost";
    var socket = io.connect(serverIP + ':4000');
    console.log('socket connected to: ' + serverIP);
    runSocket();
    
    function runSocket() {
        socket.on('message_update', function(data) {
            console.log(data);
            $scope.messages.push(data);
        });
    }

    angular.module('ManusDebug', [])
    .factory('posts', [function(){
          var o = {
                  posts: []
          };
            return o;
    }])
    .controller('MainCtrl', [
        '$scope',
        'posts',
        function($scope, posts){
            $scope.messages = [];

            $scope.posts = posts.posts;
            $scope.sendTestData = function() {
               $.get('/api/sendTestData', function(res) {
                });
            };
            $scope.incrementUpvotes = function(post) {
                post.upvotes += 1;
            };
                
        }
    ]);
}());

