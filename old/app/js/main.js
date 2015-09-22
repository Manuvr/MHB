(function () {
	'use strict';

	var socket = io.connect();


	angular.module('ManusDebug', ['ui.router', 'luegg.directives'])
		.config(function ($stateProvider, $urlRouterProvider) {

			$urlRouterProvider.otherwise('/');

			$stateProvider
				.state('home', {
					url        : '/',
					templateUrl: 'partials/partial-home.html',
					controller : 'MainCtrl'
				})
				.state('glove', {
					url        : '/glove',
					templateUrl: 'partials/partial-glove.html',
					controller : 'MainCtrl'
				})
				.state('hand', {
					url        : '/hand',
					templateUrl: 'js/3minNew.html'
				})
		})
		.factory('commands', ['$http', function ($http) {
			var o = {
				commands: {}
			};
			o.getAll = function () {
				//console.log('in getAll function');
				return $http.get('/api/commands').success(function (data) {

					//var getKeys = function(obj){
					//    var keys = [];
					//    for(var key in obj){
					//        keys.push(key);
					//    }
					//    return keys;
					//};
					angular.copy(data, o.commands);
				});
			};
			return o;
		}])
		.factory('argRef', ['$http', function ($http) {
			var o = {};
			o.getAll = function () {
				return $http.get('/api/argRef').success(function (data) {

					angular.copy(data, o);
				});
			};
			return o;
		}])
		.factory('gloveModel', ['$http', function ($http) {
			var o = {};
			o.getAll = function () {
				return $http.get('/api/gloveModel').success(function (data) {
					//console.log(data);
					angular.copy(data, o);
				});
			};
			return o;
		}])
		.controller('MainCtrl', [
			'$scope',
			'$interval',
			'commands',
			'argRef',
			//'gloveModel',
			//'socket',
			function ($scope, $interval, commands, argRef) {
				var timer;
				var IMU_MAP_STATE_CMD = '1542';
				commands.getAll();
				argRef.getAll();
				$scope.argRef = argRef;
				$scope.FPS = 0.0;
				//gloveModel.getAll();
        $scope.myRecordings = [];
        $scope.myRecording = null;
        $scope.myRecordingFPS = 50;
				$scope.btToggle = false;
				$scope.recordToggle = false;
				$scope.sToggle = false;
				$scope.mode = "host";
				$scope.modeOptions = ["host", "glove"];
				$scope.commands = commands.commands;
				$scope.myCommand = "";
				$scope.msgArgs = [];
				$scope.msgManArgs = [];
				$scope.myArgForms = "";
				$scope.gloveStatus = "Not Connected";
				$scope.messages = ["Welcome!"];
				$scope.gloveModel = {};
				$scope.gloveModel2 = {};
				$scope.btAddress = "00:06:66:61:32:B8"; // Just for R0 by default.... You can still scan if you want.
				$scope.sAddress = "/dev/ttyACM0"; // default on Josh's laptop
				$scope.btAddressList = [];
				$scope.boneList = [
					'CARPALS', 'METACARPALS', 'PP_1',
					'IP_1', 'DP_1', 'PP_2', 'IP_2',
					'DP_2', 'PP_3', 'IP_3', 'DP_3',
					'PP_4', 'IP_4', 'DP_4', 'PP_5',
					'IP_5', 'DP_5'];

				$scope.measure = "gyro";
				$scope.measureOptions = ["acceleration", "gyro", "mag"];

				$scope.clearLog = function(){
					$scope.messages = ["Log cleared."]
				};

				$scope.sendTestData = function () {
					if ($scope.myArgForms === "") {
						$scope.myArgForms = {};
						$scope.myArgForms.len = -1;
						$scope.msgArgs == [];
					}
					if ($scope.msgArgs[0] === undefined || !$scope.msgArgs) {
						$scope.msgArgs = 0;
					}
					console.log($scope.myArgForms);
					$.get('/api/sendTestData/' + $scope.mode + "/" + $scope.myCommand.command + "/" +
						$scope.myArgForms.len + "/" + $scope.msgArgs, function (res) {
					});
					//$scope.myArgForms = "";
					//$scope.msgArgs = [];

				};
				$scope.sendManTestData = function () {
					$.get('/api/sendManData/' + $scope.mode + "/" + IMU_MAP_STATE_CMD + "/" +
						($scope.msgManArgs ? $scope.msgManArgs : 0), function (res) {
					});
				};
				$scope.sendSync = function () {
					$.get('/api/sendSync/' + $scope.mode, function (res) {
					});
				};

				$scope.sendMassSync = function () {
					$.get('/api/sendMassSync/' + $scope.mode, function (res) {
					});
				};

				$scope.scanBT = function () {
					$.get('/api/scanBT', function (res) {
					})
				};

				$scope.connectBT = function (address) {
					$scope.btToggle = true;
					$.get('/api/connectBT/' + address, function (res) {
					});
				};

				$scope.disconnectBT = function () {
					$scope.btToggle = false;
					$.get('/api/disconnectBT', function (res) {
					});
				};

				$scope.autoConnectSerial = function(){
					$.get('/api/autoConnectSerial');
					$scope.gloveStatus = "Connect serial device (5 seconds left)";
					var i = 4;
					timer =
						$interval(function () {
							$scope.gloveStatus = "Connect serial device (" + i + " seconds left)";
							i-- || $interval.cancel(timer);
						}, 1000);

					$scope.sToggle = true;
				};

				$scope.closeSerial = function(){
					$.get('/api/closeSerial')
				};

				$scope.scanSerial = function(){
					$.get('/api/scanSerial')
				};

				$scope.connectSerial = function(port){
					$.get('/api/connectSerial/' + port, function (res){
					});
				};

				socket.on('FPS', function (value) {
					$scope.$apply(function () {
						$scope.FPS = value;
					});
				});

				socket.on('serialConnected', function(value){
					$scope.$apply(function () {
						console.log("got serial connected " + value);
						$interval.cancel(timer);
						switch (value) {
							case 1:
								$scope.gloveStatus = "Connected via Serial.";
								$scope.sToggle = true;
								$scope.mode = "glove"
								break;
							case 0:
								$scope.gloveStatus = "Not Connected";
								$scope.sToggle = false;
								$scope.mode = "host"
								break;
						}
					})
				});

				socket.on('serialList', function(data){
					$scope.$apply(function(){
						$scope.messages.push("PORT LIST:");
						data.forEach(function(e, i, a){
							$scope.messages.push(e);
						})
					})
				});

				socket.on('btFound', function (address, name) {
					$scope.$apply(function () {
						console.log(address + " " + name);
						//$scope.btAddressList.push({address: address, name: name});
						$scope.messages.push("BT: " + name + " @ " + address);
					})
				});

				socket.on('message_update', function (data, def) {
					$scope.$apply(function () {
						data.name = def;
						//console.log(data);
						$scope.messages.push("COMMAND: " + def + ": " + data.msg.args );
					});
				});

				socket.on('glove_update', function (data) {
					$scope.$apply(function () {
						$scope.gloveModel = data;
						//console.log($scope.gloveModel);
					});
				});

				socket.on('bt_connection', function (data) {
					$scope.$apply(function () {
						switch (data) {
							case 1:
								$scope.gloveStatus = "Connected via Bluetooth.";
								$scope.btToggle = true;
								$scope.mode = "glove";
								break;
							case 0:
								$scope.gloveStatus = "Not Connected";
								$scope.btToggle = false;
								$scope.mode = "host";
								break;
							case -1:
								$scope.gloveStatus = "Pending Connection...";
								$scope.btToggle = true;
								break;
						}
					});
				});

				socket.on('outCommand', function (data) {
					console.log(data);
					$scope.$apply(function () {
            $scope.commands = data;
            console.log(JSON.stringify(data));
					});
				});

				$scope.randomIMUmag = function () {
					$.get('/api/updateGloveModelRandom', function (res) {
					});
        };
        $scope.enableRecord = function () {
					$scope.recordToggle = true;
					$.get('/api/enableRecording', function (res) {});
				};
        $scope.disableRecord = function () {
					$scope.recordToggle = false;
					$.get('/api/disableRecording', function (res) {});
        };
        $scope.playRecording = function () {
					$.get('/api/playRecording/' + 
                $scope.myRecording + '/' +
                $scope.myRecordingFPS, function (res) {});
        };
        $scope.getRecordings = function() {
          $.get('/api/getRecordings', function(res) {
            $scope.myRecordings = JSON.parse(res);
          });
        };
        $scope.getRecordings();
			}
		]);


}());