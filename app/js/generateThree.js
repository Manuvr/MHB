/*

Generate 3D render using data from IMU.

*/
THREE.TrackballControls = function ( object, domElement ) {

	var _this = this;
	var STATE = { NONE: -1, ROTATE: 0, ZOOM: 1, PAN: 2, TOUCH_ROTATE: 3, TOUCH_ZOOM_PAN: 4 };

	this.object = object;
	this.domElement = ( domElement !== undefined ) ? domElement : document;

	// API

	this.enabled = true;

	this.screen = { left: 0, top: 0, width: 0, height: 0 };

	this.rotateSpeed = 1.0;
	this.zoomSpeed = 1.2;
	this.panSpeed = 0.3;

	this.noRotate = false;
	this.noZoom = false;
	this.noPan = false;
	this.noRoll = false;

	this.staticMoving = false;
	this.dynamicDampingFactor = 0.2;

	this.minDistance = 0;
	this.maxDistance = Infinity;

	this.keys = [ 65 /*A*/, 83 /*S*/, 68 /*D*/ ];

	// internals

	this.target = new THREE.Vector3();

	var EPS = 0.000001;

	var lastPosition = new THREE.Vector3();

	var _state = STATE.NONE,
		_prevState = STATE.NONE,

		_eye = new THREE.Vector3(),

		_rotateStart = new THREE.Vector3(),
		_rotateEnd = new THREE.Vector3(),

		_zoomStart = new THREE.Vector2(),
		_zoomEnd = new THREE.Vector2(),

		_touchZoomDistanceStart = 0,
		_touchZoomDistanceEnd = 0,

		_panStart = new THREE.Vector2(),
		_panEnd = new THREE.Vector2();

	// for reset

	this.target0 = this.target.clone();
	this.position0 = this.object.position.clone();
	this.up0 = this.object.up.clone();

	// events

	var changeEvent = { type: 'change' };
	var startEvent = { type: 'start'};
	var endEvent = { type: 'end'};


	// methods

	this.handleResize = function () {

		if ( this.domElement === document ) {

			this.screen.left = 0;
			this.screen.top = 0;
			this.screen.width = window.innerWidth;
			this.screen.height = window.innerHeight;

		} else {

			var box = this.domElement.getBoundingClientRect();
			// adjustments come from similar code in the jquery offset() function
			var d = this.domElement.ownerDocument.documentElement;
			this.screen.left = box.left + window.pageXOffset - d.clientLeft;
			this.screen.top = box.top + window.pageYOffset - d.clientTop;
			this.screen.width = box.width;
			this.screen.height = box.height;

		}

	};

	this.handleEvent = function ( event ) {

		if ( typeof this[ event.type ] == 'function' ) {

			this[ event.type ]( event );

		}

	};

	var getMouseOnScreen = ( function () {

		var vector = new THREE.Vector2();

		return function ( pageX, pageY ) {

			vector.set(
				( pageX - _this.screen.left ) / _this.screen.width,
				( pageY - _this.screen.top ) / _this.screen.height
			);

			return vector;

		};

	}() );

	var getMouseProjectionOnBall = ( function () {

		var vector = new THREE.Vector3();
		var objectUp = new THREE.Vector3();
		var mouseOnBall = new THREE.Vector3();

		return function ( pageX, pageY ) {

			mouseOnBall.set(
				( pageX - _this.screen.width * 0.5 - _this.screen.left ) / (_this.screen.width * 0.5),
				( _this.screen.height * 0.5 + _this.screen.top - pageY ) / (_this.screen.height * 0.5),
				0.0
			);

			var length = mouseOnBall.length();

			if ( _this.noRoll ) {

				if ( length < Math.SQRT1_2 ) {

					mouseOnBall.z = Math.sqrt( 1.0 - length*length );

				} else {

					mouseOnBall.z = 0.5 / length;

				}

			} else if ( length > 1.0 ) {

				mouseOnBall.normalize();

			} else {

				mouseOnBall.z = Math.sqrt( 1.0 - length * length );

			}

			_eye.copy( _this.object.position ).sub( _this.target );

			vector.copy( _this.object.up ).setLength( mouseOnBall.y );
			vector.add( objectUp.copy( _this.object.up ).cross( _eye ).setLength( mouseOnBall.x ) );
			vector.add( _eye.setLength( mouseOnBall.z ) );

			return vector;

		};

	}() );

	this.rotateCamera = (function(){

		var axis = new THREE.Vector3(),
			quaternion = new THREE.Quaternion();


		return function () {

			var angle = Math.acos( _rotateStart.dot( _rotateEnd ) / _rotateStart.length() / _rotateEnd.length() );

			if ( angle ) {

				axis.crossVectors( _rotateStart, _rotateEnd ).normalize();

				angle *= _this.rotateSpeed;

				quaternion.setFromAxisAngle( axis, -angle );

				_eye.applyQuaternion( quaternion );
				_this.object.up.applyQuaternion( quaternion );

				_rotateEnd.applyQuaternion( quaternion );

				if ( _this.staticMoving ) {

					_rotateStart.copy( _rotateEnd );

				} else {

					quaternion.setFromAxisAngle( axis, angle * ( _this.dynamicDampingFactor - 1.0 ) );
					_rotateStart.applyQuaternion( quaternion );

				}

			}
		};

	}());

	this.zoomCamera = function () {
		var factor = null;
		if ( _state === STATE.TOUCH_ZOOM_PAN ) {

			factor = _touchZoomDistanceStart / _touchZoomDistanceEnd;
			_touchZoomDistanceStart = _touchZoomDistanceEnd;
			_eye.multiplyScalar( factor );

		} else {

			factor = 1.0 + ( _zoomEnd.y - _zoomStart.y ) * _this.zoomSpeed;

			if ( factor !== 1.0 && factor > 0.0 ) {

				_eye.multiplyScalar( factor );

				if ( _this.staticMoving ) {

					_zoomStart.copy( _zoomEnd );

				} else {

					_zoomStart.y += ( _zoomEnd.y - _zoomStart.y ) * this.dynamicDampingFactor;

				}

			}

		}

	};

	this.panCamera = (function(){

		var mouseChange = new THREE.Vector2(),
			objectUp = new THREE.Vector3(),
			pan = new THREE.Vector3();

		return function () {

			mouseChange.copy( _panEnd ).sub( _panStart );

			if ( mouseChange.lengthSq() ) {

				mouseChange.multiplyScalar( _eye.length() * _this.panSpeed );

				pan.copy( _eye ).cross( _this.object.up ).setLength( mouseChange.x );
				pan.add( objectUp.copy( _this.object.up ).setLength( mouseChange.y ) );

				_this.object.position.add( pan );
				_this.target.add( pan );

				if ( _this.staticMoving ) {

					_panStart.copy( _panEnd );

				} else {

					_panStart.add( mouseChange.subVectors( _panEnd, _panStart ).multiplyScalar( _this.dynamicDampingFactor ) );

				}

			}
		};

	}());

	this.checkDistances = function () {

		if ( !_this.noZoom || !_this.noPan ) {

			if ( _eye.lengthSq() > _this.maxDistance * _this.maxDistance ) {

				_this.object.position.addVectors( _this.target, _eye.setLength( _this.maxDistance ) );

			}

			if ( _eye.lengthSq() < _this.minDistance * _this.minDistance ) {

				_this.object.position.addVectors( _this.target, _eye.setLength( _this.minDistance ) );

			}

		}

	};

	this.update = function () {

		_eye.subVectors( _this.object.position, _this.target );

		if ( !_this.noRotate ) {

			_this.rotateCamera();

		}

		if ( !_this.noZoom ) {

			_this.zoomCamera();

		}

		if ( !_this.noPan ) {

			_this.panCamera();

		}

		_this.object.position.addVectors( _this.target, _eye );

		_this.checkDistances();

		_this.object.lookAt( _this.target );

		if ( lastPosition.distanceToSquared( _this.object.position ) > EPS ) {

			_this.dispatchEvent( changeEvent );

			lastPosition.copy( _this.object.position );

		}

	};

	this.reset = function () {

		_state = STATE.NONE;
		_prevState = STATE.NONE;

		_this.target.copy( _this.target0 );
		_this.object.position.copy( _this.position0 );
		_this.object.up.copy( _this.up0 );

		_eye.subVectors( _this.object.position, _this.target );

		_this.object.lookAt( _this.target );

		_this.dispatchEvent( changeEvent );

		lastPosition.copy( _this.object.position );

	};

	// listeners

	function keydown( event ) {

		if ( _this.enabled === false ) return;

		window.removeEventListener( 'keydown', keydown );

		_prevState = _state;

		if ( _state !== STATE.NONE ) {

			return;

		} else if ( event.keyCode === _this.keys[ STATE.ROTATE ] && !_this.noRotate ) {

			_state = STATE.ROTATE;

		} else if ( event.keyCode === _this.keys[ STATE.ZOOM ] && !_this.noZoom ) {

			_state = STATE.ZOOM;

		} else if ( event.keyCode === _this.keys[ STATE.PAN ] && !_this.noPan ) {

			_state = STATE.PAN;

		}

	}

	function keyup( event ) {

		if ( _this.enabled === false ) return;

		_state = _prevState;

		window.addEventListener( 'keydown', keydown, false );

	}

	function mousedown( event ) {

		if ( _this.enabled === false ) return;

		event.preventDefault();
		event.stopPropagation();

		if ( _state === STATE.NONE ) {

			_state = event.button;

		}

		if ( _state === STATE.ROTATE && !_this.noRotate ) {

			_rotateStart.copy( getMouseProjectionOnBall( event.pageX, event.pageY ) );
			_rotateEnd.copy( _rotateStart );

		} else if ( _state === STATE.ZOOM && !_this.noZoom ) {

			_zoomStart.copy( getMouseOnScreen( event.pageX, event.pageY ) );
			_zoomEnd.copy(_zoomStart);

		} else if ( _state === STATE.PAN && !_this.noPan ) {

			_panStart.copy( getMouseOnScreen( event.pageX, event.pageY ) );
			_panEnd.copy(_panStart);

		}

		document.addEventListener( 'mousemove', mousemove, false );
		document.addEventListener( 'mouseup', mouseup, false );

		_this.dispatchEvent( startEvent );

	}

	function mousemove( event ) {

		if ( _this.enabled === false ) return;

		event.preventDefault();
		event.stopPropagation();

		if ( _state === STATE.ROTATE && !_this.noRotate ) {

			_rotateEnd.copy( getMouseProjectionOnBall( event.pageX, event.pageY ) );

		} else if ( _state === STATE.ZOOM && !_this.noZoom ) {

			_zoomEnd.copy( getMouseOnScreen( event.pageX, event.pageY ) );

		} else if ( _state === STATE.PAN && !_this.noPan ) {

			_panEnd.copy( getMouseOnScreen( event.pageX, event.pageY ) );

		}

	}

	function mouseup( event ) {

		if ( _this.enabled === false ) return;

		event.preventDefault();
		event.stopPropagation();

		_state = STATE.NONE;

		document.removeEventListener( 'mousemove', mousemove );
		document.removeEventListener( 'mouseup', mouseup );
		_this.dispatchEvent( endEvent );

	}

	function mousewheel( event ) {

		if ( _this.enabled === false ) return;

		event.preventDefault();
		event.stopPropagation();

		var delta = 0;

		if ( event.wheelDelta ) { // WebKit / Opera / Explorer 9

			delta = event.wheelDelta / 40;

		} else if ( event.detail ) { // Firefox

			delta = - event.detail / 3;

		}

		_zoomStart.y += delta * 0.01;
		_this.dispatchEvent( startEvent );
		_this.dispatchEvent( endEvent );

	}

	function touchstart( event ) {

		if ( _this.enabled === false ) return;

		switch ( event.touches.length ) {

			case 1:
				_state = STATE.TOUCH_ROTATE;
				_rotateStart.copy( getMouseProjectionOnBall( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY ) );
				_rotateEnd.copy( _rotateStart );
				break;

			case 2:
				_state = STATE.TOUCH_ZOOM_PAN;
				var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
				var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
				_touchZoomDistanceEnd = _touchZoomDistanceStart = Math.sqrt( dx * dx + dy * dy );

				var x = ( event.touches[ 0 ].pageX + event.touches[ 1 ].pageX ) / 2;
				var y = ( event.touches[ 0 ].pageY + event.touches[ 1 ].pageY ) / 2;
				_panStart.copy( getMouseOnScreen( x, y ) );
				_panEnd.copy( _panStart );
				break;

			default:
				_state = STATE.NONE;

		}
		_this.dispatchEvent( startEvent );


	}

	function touchmove( event ) {

		if ( _this.enabled === false ) return;

		event.preventDefault();
		event.stopPropagation();

		switch ( event.touches.length ) {

			case 1:
				_rotateEnd.copy( getMouseProjectionOnBall( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY ) );
				break;

			case 2:
				var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
				var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
				_touchZoomDistanceEnd = Math.sqrt( dx * dx + dy * dy );

				var x = ( event.touches[ 0 ].pageX + event.touches[ 1 ].pageX ) / 2;
				var y = ( event.touches[ 0 ].pageY + event.touches[ 1 ].pageY ) / 2;
				_panEnd.copy( getMouseOnScreen( x, y ) );
				break;

			default:
				_state = STATE.NONE;

		}

	}

	function touchend( event ) {

		if ( _this.enabled === false ) return;

		switch ( event.touches.length ) {

			case 1:
				_rotateEnd.copy( getMouseProjectionOnBall( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY ) );
				_rotateStart.copy( _rotateEnd );
				break;

			case 2:
				_touchZoomDistanceStart = _touchZoomDistanceEnd = 0;

				var x = ( event.touches[ 0 ].pageX + event.touches[ 1 ].pageX ) / 2;
				var y = ( event.touches[ 0 ].pageY + event.touches[ 1 ].pageY ) / 2;
				_panEnd.copy( getMouseOnScreen( x, y ) );
				_panStart.copy( _panEnd );
				break;

		}

		_state = STATE.NONE;
		_this.dispatchEvent( endEvent );

	}

	this.domElement.addEventListener( 'contextmenu', function ( event ) { event.preventDefault(); }, false );

	this.domElement.addEventListener( 'mousedown', mousedown, false );

	this.domElement.addEventListener( 'mousewheel', mousewheel, false );
	this.domElement.addEventListener( 'DOMMouseScroll', mousewheel, false ); // firefox

	this.domElement.addEventListener( 'touchstart', touchstart, false );
	this.domElement.addEventListener( 'touchend', touchend, false );
	this.domElement.addEventListener( 'touchmove', touchmove, false );

	window.addEventListener( 'keydown', keydown, false );
	window.addEventListener( 'keyup', keyup, false );

	this.handleResize();

	// force an update at start
	this.update();

};

THREE.TrackballControls.prototype = Object.create( THREE.EventDispatcher.prototype );
THREE.TrackballControls.prototype.constructor = THREE.TrackballControls;

// Declare required variables.
var container;
var camera, scene, renderer;
var cube, plane;
var targetRotation = 0;
var targetRotationOnMouseDown = 0;
var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;
var showVector = 'acc';

var gm = null;
var vec = new THREE.Vector3(1,0,0);

var sphere_DP_1;
var sphere_IP_1;
var sphere_PP_1;
var sphere_DP_2;
var sphere_IP_2;
var sphere_PP_2;
var sphere_DP_3;
var sphere_IP_3;
var sphere_PP_3;
var sphere_DP_4;
var sphere_IP_4;
var sphere_PP_4;
var sphere_DP_5;
var sphere_IP_5;
var sphere_PP_5;
var sphere_CARPALS;
var sphere_METACARPALS;

var arrow_DP_1;
var arrow_IP_1;
var arrow_PP_1;
var arrow_DP_2;
var arrow_IP_2;
var arrow_PP_2;
var arrow_DP_3;
var arrow_IP_3;
var arrow_PP_3;
var arrow_DP_4;
var arrow_IP_4;
var arrow_PP_4;
var arrow_DP_5;
var arrow_IP_5;
var arrow_PP_5;
var arrow_CARPALS;
var arrow_METACARPALS;

//Connect to socket.io
var socket = io.connect();

// Start reading IMU data.
runSocket();
init();
animate();

function runSocket() {


        socket.on('glove_update', function(data) {
            gm = data.IMU_set;
        });
}

function init() {

    // IMU positions on scene.
  // TODO: D AND P OUT OF ORDER
    imus = {
        DP_1: new THREE.Vector3(0, 0, 0),
        IP_1: new THREE.Vector3(90, 20, 0),
        PP_1: new THREE.Vector3(170, 40, 0),
        DP_2: new THREE.Vector3(10, 300, 0),
        IP_2: new THREE.Vector3(-2, 210, 0),
        PP_2: new THREE.Vector3(-10, 120, 0),
        DP_3: new THREE.Vector3(-100, 360, 0),
        IP_3: new THREE.Vector3(-100, 250, 0),
        PP_3: new THREE.Vector3(-100, 120, 0),
        DP_4: new THREE.Vector3(-200, 350, 0),
        IP_4: new THREE.Vector3(-200, 245, 0),
        PP_4: new THREE.Vector3(-200, 120, 0),
        DP_5: new THREE.Vector3(-300, 300, 0),
        IP_5: new THREE.Vector3(-280, 200, 0),
        PP_5: new THREE.Vector3(-270, 100, 0),
        CARPALS: new THREE.Vector3(-130, -60, 0),
        METACARPALS: new THREE.Vector3(-130, -150, 0)
    };

    // store each joint object for armature
    var jointMap = {};

    function GLTransform () {
        this.position = THREE.Vector3();
        this.rotation = THREE.Vector3();
        this.scale = THREE.Vector3();
    }

    function Joint (jname) {
        this.inverseBindPose = [];
        this.bindPose = [];
        // starts with initial matrix, builds with each multiplication
        this.currentPose = [];
        this.jointTransform = new GLTransform();
        // matrix after all multiplations
        this.finalPose = [];
        this.localBindPose = [];

        this.jointParent = null; 

        this.name = jname;
        this.addChild = function(j) {
            j.jointParent = this;
            return j;
        };
        this.getParent = function() {
            return jointParent;
        };
    }

    function Armature () {
        // keep track of the root joint for ease,
        // can be derived from other joints
        this.rootJoint = null;



    }

    container = document.createElement( 'div' );
    document.body.appendChild( container );

    var info = document.createElement( 'div' );
    info.style.position = 'absolute';
    info.style.top = '10px';
    info.style.width = '100%';
    info.style.textAlign = 'center';
    info.innerHTML = 'GLOVE';
    info.setAttribute('id', 'pourHeading');
    container.appendChild( info );

    $("#pourHeading").append("<div id='subHeading'>FAKE</div>");
    $( "#subHeading" ).on("click", function() {
        $.get('/api/updateGloveModelFakeData', function(res){
        });
    });
    $("#pourHeading").append("<div id='vectorDrop'>" +
        "<span id='vacc' class='vecs'>acceleration</span>&nbsp;&nbsp;" +
        "<span id='vgyro' class='vecs'>gyro</span>&nbsp;&nbsp;" +
        "<span id='vmag' class='vecs'>mag</span>&nbsp;&nbsp;" +
      "</div>");
    $( "#vacc" ).on("click", function() {
      showVector = 'acc';
      $(this).css('font-weight', 'bold');
      $( "#vmag" ).css('font-weight', 'normal');
      $( "#vgyro" ).css('font-weight', 'normal');
    });
    $( "#vmag" ).on("click", function() {
      showVector = 'mag';
      $(this).css('font-weight', 'bold');
      $( "#vacc" ).css('font-weight', 'normal');
      $( "#vgyro" ).css('font-weight', 'normal');
    });
    $( "#vgyro" ).on("click", function() {
      showVector = 'gyro';
      $(this).css('font-weight', 'bold');
      $( "#vmag" ).css('font-weight', 'normal');
      $( "#vacc" ).css('font-weight', 'normal');
    });

    // Set up camera.
    camera = new THREE.PerspectiveCamera( 30, window.innerWidth / window.innerHeight, 1, 10000 );

	camera.position.x = 400;
    camera.position.y = 500;
    camera.position.z = 1600;

	controls = new THREE.TrackballControls( camera );
	controls.target.set( 0, 0, 0 );

	controls.rotateSpeed = 1.0;
	controls.zoomSpeed = 1.2;
	controls.panSpeed = 0.8;

	controls.noZoom = false;
	controls.noPan = false;

	controls.staticMoving = true;
	controls.dynamicDampingFactor = 0.3;

	controls.keys = [ 65, 83, 68 ];

	controls.addEventListener( 'change', render );

    scene = new THREE.Scene();

    // Create spheres.
    var geometry = new THREE.SphereGeometry( 20, 8, 6 );
    var material = new THREE.MeshBasicMaterial( {wireframe: true, color: 'blue' } );
    sphere_DP_1 = new THREE.Mesh( geometry, material );
    sphere_IP_1 = new THREE.Mesh( geometry, material );
    sphere_PP_1 = new THREE.Mesh( geometry, material );
    sphere_DP_2 = new THREE.Mesh( geometry, material );
    sphere_IP_2 = new THREE.Mesh( geometry, material );
    sphere_PP_2 = new THREE.Mesh( geometry, material );
    sphere_DP_3 = new THREE.Mesh( geometry, material );
    sphere_IP_3 = new THREE.Mesh( geometry, material );
    sphere_PP_3 = new THREE.Mesh( geometry, material );
    sphere_DP_4 = new THREE.Mesh( geometry, material );
    sphere_IP_4 = new THREE.Mesh( geometry, material );
    sphere_PP_4 = new THREE.Mesh( geometry, material );
    sphere_DP_5 = new THREE.Mesh( geometry, material );
    sphere_IP_5 = new THREE.Mesh( geometry, material );
    sphere_PP_5 = new THREE.Mesh( geometry, material );
    sphere_CARPALS = new THREE.Mesh( geometry, material );
    sphere_METACARPALS = new THREE.Mesh( geometry, material );

    // Apply sphere positions.
    sphere_DP_1.position.set(imus.DP_1.x, imus.DP_1.y, imus.DP_1.z);
    sphere_IP_1.position.set(imus.IP_1.x, imus.IP_1.y, imus.IP_1.z);
    sphere_PP_1.position.set(imus.PP_1.x, imus.PP_1.y, imus.PP_1.z);
    sphere_DP_2.position.set(imus.DP_2.x, imus.DP_2.y, imus.DP_2.z);
    sphere_IP_2.position.set(imus.IP_2.x, imus.IP_2.y, imus.IP_2.z);
    sphere_PP_2.position.set(imus.PP_2.x, imus.PP_2.y, imus.PP_2.z);
    sphere_DP_3.position.set(imus.DP_3.x, imus.DP_3.y, imus.DP_3.z);
    sphere_IP_3.position.set(imus.IP_3.x, imus.IP_3.y, imus.IP_3.z);
    sphere_PP_3.position.set(imus.PP_3.x, imus.PP_3.y, imus.PP_3.z);
    sphere_DP_4.position.set(imus.DP_4.x, imus.DP_4.y, imus.DP_4.z);
    sphere_IP_4.position.set(imus.IP_4.x, imus.IP_4.y, imus.IP_4.z);
    sphere_PP_4.position.set(imus.PP_4.x, imus.PP_4.y, imus.PP_4.z);
    sphere_DP_5.position.set(imus.DP_5.x, imus.DP_5.y, imus.DP_5.z);
    sphere_IP_5.position.set(imus.IP_5.x, imus.IP_5.y, imus.IP_5.z);
    sphere_PP_5.position.set(imus.PP_5.x, imus.PP_5.y, imus.PP_5.z);
    sphere_CARPALS.position.set(imus.CARPALS.x, imus.CARPALS.y, imus.CARPALS.z);
    sphere_METACARPALS.position.set(imus.METACARPALS.x, imus.METACARPALS.y, imus.METACARPALS.z);


    scene.add( sphere_DP_1, sphere_IP_1, sphere_PP_1,
            sphere_DP_2,sphere_IP_2, sphere_PP_2,
            sphere_DP_3,sphere_IP_3, sphere_PP_3,
            sphere_DP_4,sphere_IP_4, sphere_PP_4,
            sphere_DP_5,sphere_IP_5, sphere_PP_5,
            sphere_CARPALS, sphere_METACARPALS
            );



    // Axis Helper.
    var axisHelper = new THREE.AxisHelper( 200 );
    scene.add(axisHelper);

    // Arrow Helpers to display mag data per IMU.
    arrow_DP_1 = new THREE.ArrowHelper(vec.normalize(), imus.DP_1, 60, 0x884400);
    arrow_IP_1 = new THREE.ArrowHelper(vec.normalize(), imus.IP_1, 60, 0x884400);
    arrow_PP_1 = new THREE.ArrowHelper(vec.normalize(), imus.PP_1, 60, 0x884400);
    arrow_DP_2 = new THREE.ArrowHelper(vec.normalize(), imus.DP_2, 60, 0x884400);
    arrow_IP_2 = new THREE.ArrowHelper(vec.normalize(), imus.IP_2, 60, 0x884400);
    arrow_PP_2 = new THREE.ArrowHelper(vec.normalize(), imus.PP_2, 60, 0x884400);
    arrow_DP_3 = new THREE.ArrowHelper(vec.normalize(), imus.DP_3, 60, 0x884400);
    arrow_IP_3 = new THREE.ArrowHelper(vec.normalize(), imus.IP_3, 60, 0x884400);
    arrow_PP_3 = new THREE.ArrowHelper(vec.normalize(), imus.PP_3, 60, 0x884400);
    arrow_DP_4 = new THREE.ArrowHelper(vec.normalize(), imus.DP_4, 60, 0x884400);
    arrow_IP_4 = new THREE.ArrowHelper(vec.normalize(), imus.IP_4, 60, 0x884400);
    arrow_PP_4 = new THREE.ArrowHelper(vec.normalize(), imus.PP_4, 60, 0x884400);
    arrow_DP_5 = new THREE.ArrowHelper(vec.normalize(), imus.DP_5, 60, 0x884400);
    arrow_IP_5 = new THREE.ArrowHelper(vec.normalize(), imus.IP_5, 60, 0x884400);
    arrow_PP_5 = new THREE.ArrowHelper(vec.normalize(), imus.PP_5, 60, 0x884400);
    arrow_CARPALS = new THREE.ArrowHelper(vec.normalize(), imus.CARPALS, 60, 0x884400);
    arrow_METACARPALS = new THREE.ArrowHelper(vec.normalize(), imus.METACARPALS, 60, 0x884400);

    scene.add(arrow_DP_1, arrow_IP_1, arrow_PP_1,
            arrow_DP_2, arrow_IP_2, arrow_PP_2,
            arrow_DP_3, arrow_IP_3, arrow_PP_3,
            arrow_DP_4, arrow_IP_4, arrow_PP_4,
            arrow_DP_5, arrow_IP_5, arrow_PP_5,
            arrow_CARPALS, arrow_METACARPALS
            );

    renderer = new THREE.CanvasRenderer();
    renderer.setClearColor( 0xf0f0f0 );
    renderer.setSize( window.innerWidth, window.innerHeight );
    container.appendChild( renderer.domElement );

    window.addEventListener( 'resize', onWindowResize, false );
}

function onWindowResize() {
        windowHalfX = window.innerWidth / 2;
        windowHalfY = window.innerHeight / 2;

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize( window.innerWidth, window.innerHeight );
}

function animate() {

  requestAnimationFrame( animate );
  if (gm) {

    updateTempMap();

    if (showVector = 'accel') {
      updateArrows('acc');
    }
    else if (showVector = 'mag') {
      updateArrows('mag');
    }
    else if (showVector = 'gyro') {
      updateArrows('gyro');
    }
  }

  controls.update();
  render();
}

function render() {
        renderer.render( scene, camera );
}


function updateArrows(vecToUp) {

    var updDP_1 = new THREE.Euler(gm.DP_1[vecToUp].x, gm.DP_1[vecToUp].y, gm.DP_1[vecToUp].z);
    var updIP_1 = new THREE.Euler(gm.IP_1[vecToUp].x, gm.IP_1[vecToUp].y, gm.IP_1[vecToUp].z);
    var updPP_1 = new THREE.Euler(gm.PP_1[vecToUp].x, gm.PP_1[vecToUp].y, gm.PP_1[vecToUp].z);
    var updDP_2 = new THREE.Euler(gm.DP_2[vecToUp].x, gm.DP_2[vecToUp].y, gm.DP_2[vecToUp].z);
    var updIP_2 = new THREE.Euler(gm.IP_2[vecToUp].x, gm.IP_2[vecToUp].y, gm.IP_2[vecToUp].z);
    var updPP_2 = new THREE.Euler(gm.PP_2[vecToUp].x, gm.PP_2[vecToUp].y, gm.PP_2[vecToUp].z);
    var updDP_3 = new THREE.Euler(gm.DP_3[vecToUp].x, gm.DP_3[vecToUp].y, gm.DP_3[vecToUp].z);
    var updIP_3 = new THREE.Euler(gm.IP_3[vecToUp].x, gm.IP_3[vecToUp].y, gm.IP_3[vecToUp].z);
    var updPP_3 = new THREE.Euler(gm.PP_3[vecToUp].x, gm.PP_3[vecToUp].y, gm.PP_3[vecToUp].z);
    var updDP_4 = new THREE.Euler(gm.DP_4[vecToUp].x, gm.DP_4[vecToUp].y, gm.DP_4[vecToUp].z);
    var updIP_4 = new THREE.Euler(gm.IP_4[vecToUp].x, gm.IP_4[vecToUp].y, gm.IP_4[vecToUp].z);
    var updPP_4 = new THREE.Euler(gm.PP_4[vecToUp].x, gm.PP_4[vecToUp].y, gm.PP_4[vecToUp].z);
    var updDP_5 = new THREE.Euler(gm.DP_5[vecToUp].x, gm.DP_5[vecToUp].y, gm.DP_5[vecToUp].z);
    var updIP_5 = new THREE.Euler(gm.IP_5[vecToUp].x, gm.IP_5[vecToUp].y, gm.IP_5[vecToUp].z);
    var updPP_5 = new THREE.Euler(gm.PP_5[vecToUp].x, gm.PP_5[vecToUp].y, gm.PP_5[vecToUp].z);
    var updCARPALS = new THREE.Euler(gm.CARPALS[vecToUp].x, gm.CARPALS[vecToUp].y, gm.CARPALS[vecToUp].z);
    var updMETACARPALS = new THREE.Euler(gm.METACARPALS[vecToUp].x, gm.METACARPALS[vecToUp].y, gm.METACARPALS[vecToUp].z);

    // Update direction on vectors.
    arrow_DP_1.setDirection ( updDP_1 );
    arrow_IP_1.setDirection ( updIP_1 );
    arrow_PP_1.setDirection ( updPP_1 );
    arrow_DP_2.setDirection ( updDP_2 );
    arrow_IP_2.setDirection ( updIP_2 );
    arrow_PP_2.setDirection ( updPP_2 );
    arrow_DP_3.setDirection ( updDP_3 );
    arrow_IP_3.setDirection ( updIP_3 );
    arrow_PP_3.setDirection ( updPP_3 );
    arrow_DP_4.setDirection ( updDP_4 );
    arrow_IP_4.setDirection ( updIP_4 );
    arrow_PP_4.setDirection ( updPP_4 );
    arrow_DP_5.setDirection ( updDP_5 );
    arrow_IP_5.setDirection ( updIP_5 );
    arrow_PP_5.setDirection ( updPP_5 );
    arrow_CARPALS.setDirection ( updCARPALS );
    arrow_METACARPALS.setDirection ( updMETACARPALS );


    // Update magnitude on vectors.
    var mult = 60;
    arrow_DP_1.setLength(mult * (Math.sqrt( Math.pow(gm.DP_1[vecToUp].x, 2) + Math.pow(gm.DP_1[vecToUp].y, 2) + Math.pow(gm.DP_1[vecToUp].z, 2) ) ) );
    arrow_IP_1.setLength(mult * (Math.sqrt( Math.pow(gm.IP_1[vecToUp].x, 2) + Math.pow(gm.IP_1[vecToUp].y, 2) + Math.pow(gm.IP_1[vecToUp].z, 2) ) ) );
    arrow_PP_1.setLength(mult * (Math.sqrt( Math.pow(gm.PP_1[vecToUp].x, 2) + Math.pow(gm.PP_1[vecToUp].y, 2) + Math.pow(gm.PP_1[vecToUp].z, 2) ) ) );
    arrow_DP_2.setLength(mult * (Math.sqrt( Math.pow(gm.DP_2[vecToUp].x, 2) + Math.pow(gm.DP_2[vecToUp].y, 2) + Math.pow(gm.DP_2[vecToUp].z, 2) ) ) );
    arrow_IP_2.setLength(mult * (Math.sqrt( Math.pow(gm.IP_2[vecToUp].x, 2) + Math.pow(gm.IP_2[vecToUp].y, 2) + Math.pow(gm.IP_2[vecToUp].z, 2) ) ) );
    arrow_PP_2.setLength(mult * (Math.sqrt( Math.pow(gm.PP_2[vecToUp].x, 2) + Math.pow(gm.PP_2[vecToUp].y, 2) + Math.pow(gm.PP_2[vecToUp].z, 2) ) ) );
    arrow_DP_3.setLength(mult * (Math.sqrt( Math.pow(gm.DP_3[vecToUp].x, 2) + Math.pow(gm.DP_3[vecToUp].y, 2) + Math.pow(gm.DP_3[vecToUp].z, 2) ) ) );
    arrow_IP_3.setLength(mult * (Math.sqrt( Math.pow(gm.IP_3[vecToUp].x, 2) + Math.pow(gm.IP_3[vecToUp].y, 2) + Math.pow(gm.IP_3[vecToUp].z, 2) ) ) );
    arrow_PP_3.setLength(mult * (Math.sqrt( Math.pow(gm.PP_3[vecToUp].x, 2) + Math.pow(gm.PP_3[vecToUp].y, 2) + Math.pow(gm.PP_3[vecToUp].z, 2) ) ) );
    arrow_DP_4.setLength(mult * (Math.sqrt( Math.pow(gm.DP_4[vecToUp].x, 2) + Math.pow(gm.DP_4[vecToUp].y, 2) + Math.pow(gm.DP_4[vecToUp].z, 2) ) ) );
    arrow_IP_4.setLength(mult * (Math.sqrt( Math.pow(gm.IP_4[vecToUp].x, 2) + Math.pow(gm.IP_4[vecToUp].y, 2) + Math.pow(gm.IP_4[vecToUp].z, 2) ) ) );
    arrow_PP_4.setLength(mult * (Math.sqrt( Math.pow(gm.PP_4[vecToUp].x, 2) + Math.pow(gm.PP_4[vecToUp].y, 2) + Math.pow(gm.PP_4[vecToUp].z, 2) ) ) );
    arrow_DP_5.setLength(mult * (Math.sqrt( Math.pow(gm.DP_5[vecToUp].x, 2) + Math.pow(gm.DP_5[vecToUp].y, 2) + Math.pow(gm.DP_5[vecToUp].z, 2) ) ) );
    arrow_IP_5.setLength(mult * (Math.sqrt( Math.pow(gm.IP_5[vecToUp].x, 2) + Math.pow(gm.IP_5[vecToUp].y, 2) + Math.pow(gm.IP_5[vecToUp].z, 2) ) ) );
    arrow_PP_5.setLength(mult * (Math.sqrt( Math.pow(gm.PP_5[vecToUp].x, 2) + Math.pow(gm.PP_5[vecToUp].y, 2) + Math.pow(gm.PP_5[vecToUp].z, 2) ) ) );
    arrow_CARPALS.setLength(mult * (Math.sqrt( Math.pow(gm.CARPALS[vecToUp].x, 2) + Math.pow(gm.CARPALS[vecToUp].y, 2) + Math.pow(gm.CARPALS[vecToUp].z, 2) ) ) );
    arrow_METACARPALS.setLength(mult * (Math.sqrt( Math.pow(gm.METACARPALS[vecToUp].x, 2) + Math.pow(gm.METACARPALS[vecToUp].y, 2) + Math.pow(gm.METACARPALS[vecToUp].z, 2) ) ) );
}

// TODO: write this func fix gross above
function arrowSetLen (arrow, vecX, vecY, vecZ) {
}

function updateTempMap() {

    // Get temperature from current glove model.
    var updDP_1 = gm.DP_1.temp;
    var updIP_1 = gm.DP_1.temp;
    var updPP_1 = gm.DP_1.temp;
    var updDP_2 = gm.DP_1.temp;
    var updIP_2 = gm.DP_1.temp;
    var updPP_2 = gm.DP_1.temp;
    var updDP_3 = gm.DP_1.temp;
    var updIP_3 = gm.DP_1.temp;
    var updPP_3 = gm.DP_1.temp;
    var updDP_4 = gm.DP_1.temp;
    var updIP_4 = gm.DP_1.temp;
    var updPP_4 = gm.DP_1.temp;
    var updDP_5 = gm.DP_1.temp;
    var updIP_5 = gm.DP_1.temp;
    var updPP_5 = gm.DP_1.temp;
    var updCARPALS = gm.DP_1.temp;
    var updMETACARPALS = gm.DP_1.temp;

    // Update temperature in render
    sphere_DP_1.material.color.setHex(0x009933);
    sphere_IP_1.material.color.setHex(0x009933);
    sphere_PP_1.material.color.setHex(0x009933);
    sphere_DP_2.material.color.setHex(0x009933);
    sphere_IP_2.material.color.setHex(0x009933);
    sphere_PP_2.material.color.setHex(0x009933);
    sphere_DP_3.material.color.setHex(0x009933);
    sphere_IP_3.material.color.setHex(0x009933);
    sphere_PP_3.material.color.setHex(0x009933);
    sphere_DP_4.material.color.setHex(0x009933);
    sphere_IP_4.material.color.setHex(0x009933);
    sphere_PP_4.material.color.setHex(0x009933);
    sphere_DP_5.material.color.setHex(0x009933);
    sphere_IP_5.material.color.setHex(0x009933);
    sphere_PP_5.material.color.setHex(0x009933);
    sphere_CARPALS.material.color.setHex(0x009933);
    sphere_METACARPALS.material.color.setHex(0x009933);

}
