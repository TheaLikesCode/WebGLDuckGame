/**
* @Author MMGS @ www.webgl.no
* Spillprogrammeringprosjekt, høst 2014
*/
var container, stats;
var materials = [];
var scene, renderer;
var velocity = new THREE.Vector3(1,0,1);
var gravitasjonTimer=0.0;
var currentlyPressedKeys = {};
var clock = new THREE.Clock();
var camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 3000000 );
var	cameraSSAO = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 3000 );
var cameraRotation;
var spilleren;


function main(){
	init();
	animate();

}

function init() {

	container = document.createElement( 'div' );
	document.body.appendChild( container );
	document.addEventListener('keyup', handleKeyUp, false);
	document.addEventListener('keydown', handleKeyDown, false);

	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.top = '0px';
	container.appendChild( stats.domElement );

	renderer = new THREE.WebGLRenderer();
	renderer.setSize( window.innerWidth, window.innerHeight );
	container.appendChild( renderer.domElement );


	scene = new THREE.Scene();
	camera.position.set( 2000, 750, 1000);
	cameraRot= new THREE.Vector3(1,0,1);

	initCubes();
	//initParticles();
	spilleren = new Spiller();

	controls = new THREE.OrbitControls( camera );
	initVann();
	initPostprocess();
	clock.start();
}


function animate() {

	requestAnimationFrame( animate );
	stats.update();
	render();

	//camera fokus på spilleren
	cameraRot.y = spilleren.rotasjon.y;
	cameraRot.z = spilleren.rotasjon.z;
	cameraRot.x = spilleren.rotasjon.z- Math.PI ;
	controls.target = spilleren.posisjon;
	controls.update();

	updateParticles();	//Ligger i InitFunctions.js
}

function render() {
	if(camera.position.y <0) watergrp.rotation.x = Math.PI/2;
	if(camera.position.y >=0){watergrp.rotation.x = -Math.PI/2;}

	camera.position.x += spilleren.velocity.x;
	camera.position.z += spilleren.velocity.z;

	scene.overrideMaterial = depthMaterial;   
	renderer.render( scene, camera, depthRenderToTexture,true );  //render depth to texture
	scene.overrideMaterial = null;  

	cameraSSAO.position.copy(camera.position);   // needed for correct displaying Far/Near
	cameraSSAO.rotation.copy(camera.rotation);   // needed for correct displaying Far/Near

	//update LOD
	scene.traverse( function ( object ) {
		if ( object instanceof THREE.LOD ) {
			object.update( camera );
		}
	} );

	water.material.uniforms.time.value += clock.getDelta();
	water.render();
	composer.render();	// render all composer passes

	keyCheck();
	spilleren.update(clock.getDelta(), clock.getElapsedTime());

	felleCube1.position.z += Math.cos(clock.getElapsedTime())*20;
	felleCube2.position.y += Math.cos(clock.getElapsedTime()*2)*8;
			
}


function handleKeyUp(event) {
	currentlyPressedKeys[event.keyCode] = false;
}

function handleKeyDown(event) {
	currentlyPressedKeys[event.keyCode] = true;
}
//Sjekker tastaturet:
function keyCheck() {
	
	if (currentlyPressedKeys[65]) { //A
	   	spilleren.turnLeft = true;
    } else spilleren.turnLeft  = false;

    if (currentlyPressedKeys[83]) {	//S
		spilleren.backward = true;
    }else spilleren.backward = false;

    if (currentlyPressedKeys[87]) {	//W
		spilleren.forward = true;
    }  else spilleren.forward = false;
    
    if (currentlyPressedKeys[68]) {	//D
	   	spilleren.turnRight = true;
    } else spilleren.turnRight = false;
    
    if (currentlyPressedKeys[32] && spilleren.harBakkeKontakt) {	//SPACE
    	spilleren.jump = true;
    	spilleren.harBakkeKontakt = false;
    } 

}