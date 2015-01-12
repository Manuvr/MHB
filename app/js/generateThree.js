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
var vx = 0, vy = 0, vz = 0;
var dirNew = null;
var originNew = null;

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
            //data.IMU_set.CARPALS.mx: 
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

    // Create sphere 
    var geometry = new THREE.SphereGeometry( 20, 20, 20 ); 
    var material = new THREE.MeshBasicMaterial( {color: 'blue' } ); 
    var sphere1 = new THREE.Mesh( geometry, material ); 
    var sphere2 = new THREE.Mesh( geometry, material ); 
    var sphere3 = new THREE.Mesh( geometry, material ); 
    var sphere4 = new THREE.Mesh( geometry, material ); 
    var sphere5 = new THREE.Mesh( geometry, material ); 
    var sphere6 = new THREE.Mesh( geometry, material ); 
    var sphere7 = new THREE.Mesh( geometry, material ); 
    var sphere8 = new THREE.Mesh( geometry, material ); 
    var sphere9 = new THREE.Mesh( geometry, material ); 
    var sphere10 = new THREE.Mesh( geometry, material ); 
    var sphere11 = new THREE.Mesh( geometry, material ); 
    var sphere12 = new THREE.Mesh( geometry, material ); 
    var sphere13 = new THREE.Mesh( geometry, material ); 
    var sphere14 = new THREE.Mesh( geometry, material ); 
    var sphere15 = new THREE.Mesh( geometry, material ); 
    var sphere16 = new THREE.Mesh( geometry, material ); 
    var sphere17 = new THREE.Mesh( geometry, material ); 
    sphere1.position.y = 300; sphere1.position.x = -300;
    sphere2.position.y = 200; sphere2.position.x = -280;
    sphere3.position.y = 100; sphere3.position.x = -270;
    sphere4.position.y = 350; sphere4.position.x = -200;
    sphere5.position.y = 245; sphere5.position.x = -200;
    sphere6.position.y = 120; sphere6.position.x = -200;
    sphere7.position.y = 360; sphere7.position.x = -100;
    sphere8.position.y = 250; sphere8.position.x = -100;
    sphere9.position.y = 120; sphere9.position.x = -100;
    sphere10.position.y = 300; sphere10.position.x = 10;
    sphere11.position.y = 210; sphere11.position.x = -2;
    sphere12.position.y = 120; sphere12.position.x = -10;
    sphere13.position.y = 0; sphere13.position.x = 0;
    sphere14.position.y = 20; sphere14.position.x = 90;
    sphere15.position.y = 40; sphere15.position.x = 170;
    sphere16.position.y = -60; sphere16.position.x = -130;
    sphere17.position.y = -150; sphere17.position.x = -130;
    scene.add( sphere1, sphere2, sphere3, sphere4, sphere5, sphere6, 
            sphere7, sphere8, sphere9, sphere10, sphere11, sphere12,
           sphere13, sphere14, sphere15, sphere16, sphere17 );

    // Axis Helper
    var axisHelper = new THREE.AxisHelper( 200 );
    scene.add(axisHelper);

    // helper arrow
    var origin1 = new THREE.Vector3(-300, 300, 0);
    var direction1 = new THREE.Vector3(-12, -20, 0);
    arrow1 = new THREE.ArrowHelper(direction1.normalize(), origin1, 100, 0x884400);

    scene.add(arrow1);

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
        var windForce = new THREE.Vector3();
        directionUpdate.set( Math.sin( time / 2000 ), Math.cos( time / 3000 ), Math.sin( time / 1000 ) ).normalize().multiplyScalar( 40 );
        arrow1.setDirection( directionUpdate );

        render();
}

function render() {
        renderer.render( scene, camera );
}

