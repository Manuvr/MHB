/*

Generate 3D render using serial data from IMU

*/


// Declare required variables
var dataRollx = 0;
var dataRolly = 0;
var dataRollz = 0;
var dataRollxArray = [];
var dataRollyArray = [];
var dataRollzArray = [];
var accuracy = 2;
var orderOfMag = (Math.PI/180);
var container;
var camera, scene, renderer;
var cube, plane;
var targetRotation = 0;
var targetRotationOnMouseDown = 0;
var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

var arrow1 = null;
var arrow2 = null;
var vx = 0, vy = 0, vz = 0;
var dirNew = null;
var originNew = null;
var DP_1_mx = 1;
var imuSet = null;
var vec = new THREE.Vector3(1,0,0);

//Connect to socket.io
var serverIP = "localhost";
var socket = io.connect(serverIP + ':4000');
console.log('socket connected to: ' + serverIP);

// Start reading IMU data
runSocket();
init();
animate();

function runSocket() {
        socket.on('glove_update', function(data) {
            console.log(data);
            imuSet = data.IMU_set;
            /*
            if (data.charAt(0) === 'O') {
                console.log(data);
                var dataArray = data.split(/ /);

                // set x
                dataRollx = (dataArray[1] *= orderOfMag).toFixed(accuracy);
                
                // set y
                dataRolly = (dataArray[2] *= orderOfMag).toFixed(accuracy);

                // set z
                dataRollz = (dataArray[3] *= orderOfMag).toFixed(accuracy);

                console.log(dataRollx + "," + dataRolly + "," + dataRollz);
            }
            */
        });
}

function init() {

    imus = { 
        DP_1: new THREE.Vector3(-300, 300, 0),
        IP_1: new THREE.Vector3(-280, 200, 0),
        PP_1: new THREE.Vector3(-270, 100, 0),
        DP_2: new THREE.Vector3(-200, 350, 0),
        IP_2: new THREE.Vector3(-200, 245, 0),
        PP_2: new THREE.Vector3(-200, 120, 0),
        DP_3: new THREE.Vector3(-100, 360, 0),
        IP_3: new THREE.Vector3(-100, 250, 0),
        PP_3: new THREE.Vector3(-100, 120, 0),
        DP_4: new THREE.Vector3(10, 300, 0),
        IP_4: new THREE.Vector3(-2, 210, 0),
        PP_4: new THREE.Vector3(-10, 120, 0),
        DP_5: new THREE.Vector3(0, 0, 0),
        IP_5: new THREE.Vector3(90, 20, 0),
        PP_5: new THREE.Vector3(170, 40, 0),
        CARPALS: new THREE.Vector3(-130, -60, 0),
        METACARPALS: new THREE.Vector3(-130, -150, 0),
    };

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

    $("#pourHeading").append("<div id='subHeading'></div>");

    // Set up camera
    camera = new THREE.PerspectiveCamera( 30, window.innerWidth / window.innerHeight, 1, 10000 );
    
    camera.position.y = 50;
    camera.position.z = 1500;

    scene = new THREE.Scene();

    // Create spheres 
    var geometry = new THREE.SphereGeometry( 20, 20, 20 ); 
    var material = new THREE.MeshBasicMaterial( {color: 'blue' } ); 
    var sphere_DP_1 = new THREE.Mesh( geometry, material ); 
    var sphere_IP_1 = new THREE.Mesh( geometry, material ); 
    var sphere_PP_1 = new THREE.Mesh( geometry, material ); 
    var sphere_DP_2 = new THREE.Mesh( geometry, material ); 
    var sphere_IP_2 = new THREE.Mesh( geometry, material ); 
    var sphere_PP_2 = new THREE.Mesh( geometry, material ); 
    var sphere_DP_3 = new THREE.Mesh( geometry, material ); 
    var sphere_IP_3 = new THREE.Mesh( geometry, material ); 
    var sphere_PP_3 = new THREE.Mesh( geometry, material ); 
    var sphere_DP_4 = new THREE.Mesh( geometry, material ); 
    var sphere_IP_4 = new THREE.Mesh( geometry, material ); 
    var sphere_PP_4 = new THREE.Mesh( geometry, material ); 
    var sphere_DP_5 = new THREE.Mesh( geometry, material ); 
    var sphere_IP_5 = new THREE.Mesh( geometry, material ); 
    var sphere_PP_5 = new THREE.Mesh( geometry, material ); 
    var sphere_CARPALS = new THREE.Mesh( geometry, material ); 
    var sphere_METACARPALS = new THREE.Mesh( geometry, material ); 
    
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
    
    // Axis Helper
    var axisHelper = new THREE.AxisHelper( 200 );
    scene.add(axisHelper);

    // helper arrow
    var origin1 = new THREE.Vector3(-300, 300, 0);
    var direction1 = new THREE.Vector3(-12, -20, 0);
    arrow_DP_1 = new THREE.ArrowHelper(vec.normalize(), imus.DP_1, 100, 0x884400);
    arrow_IP_1 = new THREE.ArrowHelper(vec.normalize(), imus.IP_1, 100, 0x884400);


    scene.add(arrow_DP_1, arrow_IP_2);

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
        
        var time = Date.now();
        var directionUpdate = new THREE.Euler();
        directionUpdate.set( Math.sin( time / 2000 ), Math.cos( time / 3000 ), Math.sin( time / 1000 ), 'XYZ' );
        arrow1.setDirection( directionUpdate );
        
        directionUpdate2 = new THREE.Euler( Math.sin ( DP_1_mx / 2000 ), Math.cos( DP_1_mx / 3000 ), Math.sin ( DP_1_mx / 1000 ), 'XYZ');
        arrow2.setDirection ( directionUpdate2 );
        console.log(DP_1_mx);

        render();
}

function render() {
        renderer.render( scene, camera );
}

