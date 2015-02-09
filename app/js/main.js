(function() {
'use strict';

    var remove = {
		IMU_set: {
			CARPALS    : ["e_x", 'e_y', 'e_z', 'e_rx', 'e_ry', 'e_rz', 'e_mx', 'e_my', 'e_mz', 'LED', 'LED_1'],
			METACARPALS: ["e_x", 'e_y', 'e_z', 'e_rx', 'e_ry', 'e_rz', 'e_mx', 'e_my', 'e_mz', 'LED', 'LED_1'],
			PP_1       : ["e_x", 'e_y', 'e_z', 'e_rx', 'e_ry', 'e_rz', 'e_mx', 'e_my', 'e_mz', 'LED', 'LED_1'],
			IP_1       : ["e_x", 'e_y', 'e_z', 'e_rx', 'e_ry', 'e_rz', 'e_mx', 'e_my', 'e_mz', 'LED', 'LED_1'],
			DP_1       : ["e_x", 'e_y', 'e_z', 'e_rx', 'e_ry', 'e_rz', 'e_mx', 'e_my', 'e_mz', 'LED', 'LED_1'],
			PP_2       : ["e_x", 'e_y', 'e_z', 'e_rx', 'e_ry', 'e_rz', 'e_mx', 'e_my', 'e_mz', 'LED', 'LED_1'],
			IP_2       : ["e_x", 'e_y', 'e_z', 'e_rx', 'e_ry', 'e_rz', 'e_mx', 'e_my', 'e_mz', 'LED', 'LED_1'],
			DP_2       : ["e_x", 'e_y', 'e_z', 'e_rx', 'e_ry', 'e_rz', 'e_mx', 'e_my', 'e_mz', 'LED', 'LED_1'],
			PP_3       : ["e_x", 'e_y', 'e_z', 'e_rx', 'e_ry', 'e_rz', 'e_mx', 'e_my', 'e_mz', 'LED', 'LED_1'],
			IP_3       : ["e_x", 'e_y', 'e_z', 'e_rx', 'e_ry', 'e_rz', 'e_mx', 'e_my', 'e_mz', 'LED', 'LED_1'],
			DP_3       : ["e_x", 'e_y', 'e_z', 'e_rx', 'e_ry', 'e_rz', 'e_mx', 'e_my', 'e_mz', 'LED', 'LED_1'],
			PP_4       : ["e_x", 'e_y', 'e_z', 'e_rx', 'e_ry', 'e_rz', 'e_mx', 'e_my', 'e_mz', 'LED', 'LED_1'],
			IP_4       : ["e_x", 'e_y', 'e_z', 'e_rx', 'e_ry', 'e_rz', 'e_mx', 'e_my', 'e_mz', 'LED', 'LED_1'],
			DP_4       : ["e_x", 'e_y', 'e_z', 'e_rx', 'e_ry', 'e_rz', 'e_mx', 'e_my', 'e_mz', 'LED', 'LED_1'],
			PP_5       : ["e_x", 'e_y', 'e_z', 'e_rx', 'e_ry', 'e_rz', 'e_mx', 'e_my', 'e_mz', 'LED', 'LED_1'],
			IP_5       : ["e_x", 'e_y', 'e_z', 'e_rx', 'e_ry', 'e_rz', 'e_mx', 'e_my', 'e_mz', 'LED', 'LED_1'],
			DP_5       : ["e_x", 'e_y', 'e_z', 'e_rx', 'e_ry', 'e_rz', 'e_mx', 'e_my', 'e_mz', 'LED', 'LED_1']
		}
	};

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
            })
            .state('hand', {
                url: '/hand',
                templateUrl: 'js/3minNew.html'
            });
    })
    .factory('commands', ['$http', function($http){
        var o = {
            commands: []
        };
        o.getAll = function() {
            console.log('in getAll funcshn');
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
        //'gloveModel',
        //'socket',
        function($scope, commands){
            commands.getAll();
            //gloveModel.getAll();
            $scope.btToggle = false;
            $scope.mode = "host";
            $scope.modeOptions = [ "host", "glove"];
            $scope.commands = commands.commands;
            $scope.myCommand = "";
            $scope.msgArgs = 0;
            $scope.gloveStatus = "Not Connected";
            $scope.messages = [];
            $scope.gloveModel = {};
            $scope.gloveModel2 = {};
            $scope.btAddress = "00:06:66:61:32:B8";
            $scope.btAddressList = [];

            $scope.sendTestData = function() {
               $.get('/api/sendTestData/'+ $scope.mode + "/" + $scope.myCommand + "/" + $scope.msgArgs, function(res) {
                });
            };
            $scope.sendSync = function() {
                $.get('/api/sendSync/' + $scope.mode, function(res){
                });
            };

            $scope.scanBT = function() {
              $.get('/api/scanBT', function(res){
              })
            }

            $scope.connectBT = function(address) {
                $scope.btToggle = true;
                $.get('/api/connectBT/' + address, function(res){
                });
            };

            $scope.disconnectBT = function() {
                $scope.btToggle = false;
                $.get('/api/disconnectBT', function(res){
                });
            };

            socket.on('btFound', function(address, name) {
              $scope.$apply(function() {
                console.log(address + " " + name);
                $scope.btAddressList.push( { address: address, name: name})
              })
            })

            socket.on('message_update', function(data) {
                $scope.$apply(function() {
                    console.log(data);
                    $scope.messages.unshift(data);
                });
            });

            socket.on('glove_update', function(data) {
                $scope.$apply(function() {
                    $scope.gloveModel = data;
                    $scope.gloveModel2 = _.omitRecursive(data, remove);
                    console.log($scope.gloveModel);
                });
            });

            socket.on('outCommand', function(data) {
                console.log(data);
                $scope.$apply(function() {
                    console.log($scope.commands);
                    console.log(data);
                    var getKeys = function(obj){
                        var keys = [];
                        for(var key in obj){
                            keys.push(key);
                        }
                        return keys;
                    };

                    $scope.commands = getKeys(data);



                });
            });

            $scope.randomIMUmag = function() {
                // Generate random hex string
                var totalBytes = 680 * 2;
                var builtArg = "";
                var randOpts = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];
                for (var i = 0; i < totalBytes; i++) {
                    var rand = Math.floor((Math.random() * 15) + 1);
                    var hexNum = randOpts[rand];
                    builtArg += hexNum;
                }
                $scope.msgArgs = builtArg;
            };

        }
    ]);
}());
