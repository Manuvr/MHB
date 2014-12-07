(function() {
'use strict';

    require('angular');
    require('angular-route');
    require('angular-animate');
    
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

