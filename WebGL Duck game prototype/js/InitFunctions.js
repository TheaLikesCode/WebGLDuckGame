/**
* @Author MMGS @ www.webgl.no
* Spillprogrammeringprosjekt, høst 2014
*/

//Kollisjonsvariabler:
var localVertex;
var globalVertex;
//vann variabler
var waterNormals,watergrp,cubeMap;
//effekt variabler
var depthMaterial, depthRenderToTexture, composer;


function initPostprocess()
{

	// depthmaterial
	var depthShader = THREE.ShaderLib[ "depthRGBA" ];
	var depthUniforms = THREE.UniformsUtils.clone( depthShader.uniforms );
	depthMaterial = new THREE.ShaderMaterial( { fragmentShader: depthShader.fragmentShader, vertexShader: depthShader.vertexShader, uniforms: depthUniforms } );
	depthMaterial.blending = THREE.NoBlending;  //blending bad...
	depthRenderToTexture = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat } );		

	// postprocessing
	composer = new THREE.EffectComposer( renderer );   // Renderer for the composer 
	composer.addPass( new THREE.RenderPass( scene, camera ) );  // scene and camera to be rendered.

	///////// SSAO 	 shader
	effect = new THREE.ShaderPass( THREE.SSAOShader );
	effect.uniforms[ 'tDepth' ].value = depthRenderToTexture;  //update DepthTexture
	effect.uniforms[ 'size' ].value.set(  window.innerWidth, window.innerHeight ); //texture set to window size
	effect.uniforms[ 'cameraNear' ].value = cameraSSAO.near;  //update SSAO with camera information 
	effect.uniforms[ 'cameraFar' ].value = cameraSSAO.far;	//update SSAO with camera information
	effect.needsSwap = true;    //needed for shader pass
	composer.addPass( effect );

	var fxaa = new THREE.ShaderPass( THREE.FXAAShader );
	fxaa.uniforms[ 'resolution' ].value.set( 1 / window.innerWidth, 1 / window.innerHeight );
	fxaa.renderToScreen = true;
	composer.addPass( fxaa );

}

function initVann()
{

	light = new THREE.HemisphereLight( 0xffffbb, 0x080820, 2 );
	light.position.set( - 0.7, 0.3, - 0.7 );
	scene.add( light );
			// load skybox
	skyboxsize=1000000/4;
	cubeMap = new THREE.CubeTexture( [] );
	cubeMap.format = THREE.RGBFormat;
	cubeMap.flipY = false;

	var loader = new THREE.ImageLoader();

	loader.load( 'textures/skyboxsun25degtest.png', function ( image ) {

		var getSide = function ( x, y ) {
			var size = 1024;
			var canvas = document.createElement( 'canvas' );
			canvas.width = size;
			canvas.height = size;
			var context = canvas.getContext( '2d' );
			context.drawImage( image, - x * size, - y * size );
			return canvas;
		};

		cubeMap.images[ 0 ] = getSide( 2, 1 ); // px
		cubeMap.images[ 1 ] = getSide( 0, 1 ); // nx
		cubeMap.images[ 2 ] = getSide( 1, 0 ); // py
		cubeMap.images[ 3 ] = getSide( 1, 2 ); // ny
		cubeMap.images[ 4 ] = getSide( 1, 1 ); // pz
		cubeMap.images[ 5 ] = getSide( 3, 1 ); // nz
		cubeMap.needsUpdate = true;
	} );

	var cubeShader = THREE.ShaderLib['cube'];
	cubeShader.uniforms['tCube'].value = cubeMap;

	var skyBoxMaterial = new THREE.ShaderMaterial( {
		fragmentShader: cubeShader.fragmentShader,
		vertexShader: cubeShader.vertexShader,
		uniforms: cubeShader.uniforms,
		depthWrite: false,
		side: THREE.BackSide
	});

	var skyBox = new THREE.Mesh(
		new THREE.BoxGeometry( skyboxsize,skyboxsize,skyboxsize),
		skyBoxMaterial
	);				
	scene.add( skyBox );
	skyBox.scale.set(1.5,1.5,1.5);

	//water
	waterNormals = new THREE.ImageUtils.loadTexture( 'textures/sand/normal.png' );
	waterNormals.wrapS = waterNormals.wrapT = THREE.MirrorRepeatWrapping; 

	waterNormals2 = new THREE.ImageUtils.loadTexture( 'textures/waternormals.jpg' );
	waterNormals2.wrapS = waterNormals2.wrapT = THREE.MirrorRepeatWrapping; 

	water = new THREE.Water( renderer, camera, scene, {
	textureWidth: 512*2, 
	textureHeight: 512*2,
	waterNormals: waterNormals,
	waterNormals2: waterNormals2,
	alpha: 1.0,
	sunDirection: light.position.clone().normalize(),
	sunColor: 0xffffff,
	waterColor: 0x002144,
	distortionScale: 50.0,
	textureCube:cubeMap

	} );
	//////////////////////LOD water/////

	watergrp = new THREE.Object3D();
	tiles=4;	// halvparten av faktiske tiles, om 2, så 4 tiles.			
	tilesize =(skyboxsize/(tiles));  //størrelseforhold
	mapscale = tilesize*0.5; // under 2.0 for å redusere en visuell  bug

	//geometry til forskjellige avstander
	lodgeometry = [
	[ new THREE.PlaneBufferGeometry( mapscale, mapscale,28,28),mapscale/2],
	[ new THREE.PlaneBufferGeometry( mapscale, mapscale, 10,5),mapscale],

	];

	//bygger opp vanntile-kartet med origo i sentrum
	for(i=0;i<tiles;i++){
		for(j=0;j<tiles;j++){
			lod = new THREE.LOD();						
			for ( k = 0; k < lodgeometry.length; k ++ ) {			
				mirrorMesh = new THREE.Mesh( lodgeometry[ k ][ 0 ],water.material);
				mirrorMesh.updateMatrix();
				mirrorMesh.add(water);							
				mirrorMesh.matrixAutoUpdate = false;
				lod.addLevel( mirrorMesh, lodgeometry[ k ][ 1 ] );
				lod.updateMatrix();
				lod.matrixAutoUpdate = false;					
				lod.position.set(-(tiles-1)/2*mapscale+mapscale*i,-(tiles-1)/2*mapscale+mapscale*j,0);
				watergrp.add( lod);
			}	
		}
	}
	watergrp.rotation.x -= Math.PI/2;
	scene.add(watergrp);
	//seafloor
	floorgeometry = new THREE.PlaneBufferGeometry(skyboxsize*2 ,skyboxsize*2,10,10);
	floorTexture = new THREE.ImageUtils.loadTexture( 'textures/sand/diffuse.png' );
	floorMaterial = new THREE.MeshBasicMaterial({map:floorTexture});
	floorTexture.wrapS = floorTexture.wrapT = THREE.MirrorRepeatWrapping; 
	floorTexture.repeat.set(20,20,20);
	seaFloor = new THREE.Mesh( floorgeometry,floorMaterial );
	seaFloor.position.y -=5350;
	seaFloor.rotation.x -= Math.PI/2;
	scene.add(seaFloor);
}


function initCubes(){

	cubeMat = new THREE.MeshPhongMaterial({color:0xee4444 ,envMap:cubeMap, shininess:11.0,reflectivity:0.2});
	cubeMatBlue = new THREE.MeshPhongMaterial({color:0x00ffff ,envMap:cubeMap, shininess:11.0,reflectivity:0.2});
	cubeGeo = new THREE.BoxGeometry(1000,500,1000);
	cubeGeoSmall = new THREE.BoxGeometry(500,100,500);
	cubeGeoLargeLow = new THREE.BoxGeometry(1000,100,1000)
	cubeGeoSmallHigh = new THREE.BoxGeometry(1000,300,200);

	//Plattformer
	cubeMesh = new THREE.Mesh( cubeGeo, cubeMat);
	cubeMesh.name = "cube";
	cubeMesh.geometry.computeBoundingSphere();
	scene.add(cubeMesh);
	collidableMeshList.push(cubeMesh);

	cubeMesh2 = new THREE.Mesh( cubeGeo, cubeMat);
	cubeMesh2.position.set(500,300,500);
	cubeMesh2.name = "cube2";
	cubeMesh2.geometry.computeBoundingSphere();
	scene.add(cubeMesh2);
	collidableMeshList.push(cubeMesh2);

	cubeMesh5 = cubeMesh2.clone();
	cubeMesh5.position.set(700,700,1000);
	scene.add(cubeMesh5);
	collidableMeshList.push(cubeMesh5);

	cubeMesh7 = new THREE.Mesh( cubeGeoLargeLow, cubeMat);
	cubeMesh7.position.set(900,1200,2300);
	scene.add(cubeMesh7);
	collidableMeshList.push(cubeMesh7);

	cubeMesh8=cubeMesh7.clone();
	cubeMesh8.position.set(900,1400,3500);
	scene.add(cubeMesh8);
	collidableMeshList.push(cubeMesh8); 


	cubeMesh10=cubeMesh8.clone();
	cubeMesh10.position.set(-1800, 1300,3500);
	scene.add(cubeMesh10);
	collidableMeshList.push(cubeMesh10); 

	cubeMesh11=cubeMesh10.clone();
	cubeMesh11.position.set(-3400, 1000,3500);
	scene.add(cubeMesh11);
	collidableMeshList.push(cubeMesh11); 

	cubeMesh12=cubeMesh11.clone();
	cubeMesh11.position.set(-3900, 1300 ,4200);
	scene.add(cubeMesh12);
	collidableMeshList.push(cubeMesh12); 
	//Feller

	//Går frem og tilbake i z akse
	felleCube1 = new THREE.Mesh( cubeGeoSmallHigh, cubeMatBlue);
	felleCube1.position.set(900,1600,4200);
	felleCube1.name = "Felle";
	scene.add(felleCube1);
	collidableMeshList.push(felleCube1);

	//Går opp og ned
	felleCube2 = new THREE.Mesh( cubeGeoSmall, cubeMat);
	felleCube2.position.set(-400,1700,3500);
	felleCube2.name = "Felle2";
	scene.add(felleCube2);
	collidableMeshList.push(felleCube2);

}



function initParticles(){

	geometry = new THREE.Geometry();

		sprite1 = THREE.ImageUtils.loadTexture( "textures/regn2.png" );
		sprite2 =THREE.ImageUtils.loadTexture( "textures/regn2.png" );
		sprite3 = THREE.ImageUtils.loadTexture( "textures/regn1.png" );
		sprite4 =THREE.ImageUtils.loadTexture( "textures/regn1.png" );
		sprite5 =THREE.ImageUtils.loadTexture( "textures/regn1.png" );

		for ( i = 0; i < 50000; i ++ ) {

			var vertex = new THREE.Vector3();
			vertex.x = Math.random() * 2000 - 1000;
			vertex.y = Math.random() * 2000 - 1000;
			vertex.z = Math.random() * 2000 - 1000;

			geometry.vertices.push( vertex );

		}

		parameters = [ [ [1.0, 0.2, 0.5], sprite2, 20 ],
					   [ [0.95, 0.1, 0.5], sprite3, 15 ],
					   [ [0.90, 0.05, 0.5], sprite1, 10 ],
					   [ [0.85, 0, 0.5], sprite5, 8 ],
					   [ [0.80, 0, 0.5], sprite4, 5 ],
					   ];

		for ( i = 0; i < parameters.length; i ++ ) {

			color  = parameters[i][0];
			sprite = parameters[i][1];
			size   = parameters[i][2];

			materials[i] = new THREE.PointCloudMaterial( { size: size, map: sprite, blending: THREE.AdditiveBlending, depthTest: false, transparent : true } );
			materials[i].color.setHSL( color[0], color[1], color[2] );

			particles = new THREE.PointCloud( geometry, materials[i] );

			particles.rotation.x = Math.random() * 6;
			particles.rotation.y = Math.random() * 6;
			particles.rotation.z = Math.random() * 6;

			scene.add( particles );

		}
	}

function updateParticles(){
	scene.traverse( function ( object ) {
		if ( object instanceof THREE.PointCloud ) { 
				object.rotation.y -= 0.2 ;
				object.rotation.x -= 0.01 ;
				object.rotation.z -= 0.01 ;

				object.position.copy(camera.position) ;
				object.position.x -= 100 ;

		}

	} );
}