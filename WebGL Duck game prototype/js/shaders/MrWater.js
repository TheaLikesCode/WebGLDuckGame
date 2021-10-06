////////////////////////Vann/////////////////////////////////////////////////////////////////
////@Author: MMMGS @ www.webgl.no  
//// 2014-11  this.Shader is based on  www.threejs.org examples       
////  http://threejs.org/examples/#webgl_shaders_ocean																	
//// http://threejs.org/examples/#webgl_materials_shaders_fresnel																	
//// http://threejs.org/examples/#webgl_mirror
/**
* @Author MMGS @ www.webgl.no
* Spillprogrammeringprosjekt, høst 2014
*/
/////////////////////////////////////////////////////////////////////////////////////////
THREE.ShaderLib['mirror'] = {

	uniforms: { "mirrorColor": { type: "c", value: new THREE.Color(0xffffff) },
				"mirrorSampler": { type: "t", value: null },
				"textureMatrix" : { type: "m4", value: new THREE.Matrix4() }
	},

	vertexShader: [

		"uniform mat4 textureMatrix;",
		"varying vec4 mirrorCoord;",
		"void main() {",

			"vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );",
			"vec4 worldPosition = modelMatrix * vec4( position, 1.0 );",
			"mirrorCoord = textureMatrix * worldPosition;",

			"gl_Position = projectionMatrix * mvPosition;",

		"}"

	].join("\n"),

	fragmentShader: [

		"uniform vec3 mirrorColor;",
		"uniform sampler2D mirrorSampler;",

		"varying vec4 mirrorCoord;",

		"float blendOverlay(float base, float blend) {",
			"return( base < 0.5 ? ( 2.0 * base * blend ) : (1.0 - 2.0 * ( 1.0 - base ) * ( 1.0 - blend ) ) );",
		"}",
		
		"void main() {",

			"vec4 color = texture2DProj(mirrorSampler, mirrorCoord);",
			"color = vec4(blendOverlay(mirrorColor.r, color.r), blendOverlay(mirrorColor.g, color.g), blendOverlay(mirrorColor.b, color.b), 1.0);",

			"gl_FragColor = color;",

		"}"

	].join("\n")

};
THREE.ShaderLib['water'] = {

	uniforms: {
				 "normalSampler":	{ type: "t", value: null },
				  "normalSampler2":	{ type: "t", value: null },
				"mirrorSampler":	{ type: "t", value: null },
				"alpha":			{ type: "f", value: 1.0 },
				"time":				{ type: "f", value: 0.0 },
				"distortionScale":	{ type: "f", value: 20.0 },
				"textureMatrix" :	{ type: "m4", value: new THREE.Matrix4() },
				"sunColor":			{ type: "c", value: new THREE.Color( 0x7F7F7F ) },
				"sunDirection":		{ type: "v3", value: new THREE.Vector3( 0.70707, 0.70707, 0 ) },
				"eye":				{ type: "v3", value: new THREE.Vector3( 0, 0, 0 ) },
				"waterColor":		{ type: "c", value: new THREE.Color( 0x555555 ) },
				//fres
				"mRefractionRatio": { type: "f", value: 0.292 },
				"mFresnelBias": 	{ type: "f", value: 0.1 },
				"mFresnelPower": 	{ type: "f", value: 0.10 },
				"mFresnelScale": 	{ type: "f", value: 0.01 },
				"tCube": 			{ type: "t", value: null }
	},

	vertexShader: [
		'uniform mat4 textureMatrix;',
		'uniform float time;',
		'uniform sampler2D normalSampler;',
		'uniform sampler2D normalSampler2;',
		"varying vec2 vUv;",		
		'varying vec4 mirrorCoord;',
		'varying vec3 worldPosition;',
		'uniform vec3 eye;',
		'varying float wave;',
		//fresnel
		"uniform float mRefractionRatio;",
		"uniform float mFresnelBias;",
		"uniform float mFresnelScale;",
		"uniform float mFresnelPower;",


        			'vec4 getNoise( vec2 uv )', 
		'{',
		'vec2 dir = vec2(-0.5,-0.7);',
		'float speed = 0.03;',
		'float tscale = 0.01;',
		'	vec2 uv0 = ( uv /1503.0)+(time*3.1*tscale+speed)*-dir;',
		'	vec2 uv1 = (uv / 2507.0)+(time*4.2*tscale+speed*0.8)* dir;',
    	'	vec2 uv2 = (uv / 3507.0)+(time*8.3*tscale+speed*0.9)* dir;',
		'	vec2 uv3 = (uv / 2207.0)+(time*5.5*tscale+speed*0.7)* dir;',

		'	vec4 noise = ( texture2D( normalSampler, uv0-uv1 ) ) +',
        '		( texture2D( normalSampler, uv1-uv2 ) ) +',
        '		( texture2D( normalSampler, uv2-uv3) ) +',
		'		( texture2D( normalSampler, uv3-uv0 ) );',
		'	return (noise) * 0.5 - 1.0;',
		'}',


		'void main()',
		'{',

			//sender koordinater til fragmentshader
			'	mirrorCoord = modelMatrix * vec4( position, 1.0 );',
			'	worldPosition = mirrorCoord.xyz;',
			'	mirrorCoord = textureMatrix * mirrorCoord;',
			'   vUv = uv;', 
				//
			'	vec3 worldToEye = eye-worldPosition;',
			'	float distance = length(worldToEye);',
			'   vec3 newposition = position;',
			
					'	vec4 noise = getNoise( worldPosition.xz );', //texture noise fra normalmap
		'	vec3 surfaceNormal = normalize( noise.xzy);',  // verdiene normaliseres og brukes som normal.

		//regner ut høyde for bølgevertayzene om avstand er mindre enn xxxxx og ikke er på sømmen til texture
		'if(distance < 20000.0 && (uv.x > 0.00005 && uv.x < 0.99995 && uv.y > 0.00005 && uv.y < 0.99995 )){',	
			'	float amp =11.0;', //amplitude
			'	float L =1.0;',   //bølgelengde
			'	float W =2.0*3.1415/(1.0+L);',  
			'	float frequency = 1.0;',   
			'	float velocity =0.5;',
			'	float phase = velocity * frequency;',
			'	float A = amp;	',	
			'	float theta = dot(normal.xz, vec2(position.x,position.y));',

			'	float waveZ = A * sin(theta * frequency + time * phase)*W;', //bølgeligning av litt tilfeldig sort	
				' wave=newposition.z = waveZ* surfaceNormal.z;}',		// setter displacement og sender wave verdier til fragment til bruk for pikseleffekt

		

		'	gl_Position = projectionMatrix * modelViewMatrix * vec4( newposition, 1.0 );',
		'}'
	].join('\n'),

	fragmentShader: [
		'precision highp float;',
		"varying vec2 vUv;",
		'uniform sampler2D mirrorSampler;',
		'uniform samplerCube tCube;',
		'uniform float alpha;',
		'uniform float time;',
		'uniform float distortionScale;',
		'uniform sampler2D normalSampler;',
		'uniform sampler2D normalSampler2;',
		'uniform vec3 sunColor;',
		'uniform vec3 sunDirection;',
		'uniform vec3 eye;',
		'uniform vec3 waterColor;',

		'varying vec4 mirrorCoord;',
		'varying vec3 worldPosition;',
			'varying float wave;',
				//fresnel
		"uniform float mRefractionRatio;",
		"uniform float mFresnelBias;",
		"uniform float mFresnelScale;",
		"uniform float mFresnelPower;",
		//fres 
		/*"varying vec3 vReflect;",
		"varying vec3 vRefract[3];",
		"varying float vReflectionFactor;",*/
		//

		//texture noise med retning,hastighet og størrelse
			'vec4 getNoise( vec2 uv )', 
		'{',
		'vec2 dir = vec2(-0.5,-0.7);',
		'float speed = 0.03;',
		'float tscale = 0.01;',
		'	vec2 uv0 = ( uv /1503.0)+(time*3.1*tscale+speed)*-dir;',
		'	vec2 uv1 = (uv / 2507.0)+(time*4.2*tscale+speed*0.8)* dir;',
    	'	vec2 uv2 = (uv / 3507.0)+(time*8.3*tscale+speed*0.9)* dir;',
		'	vec2 uv3 = (uv / 2207.0)+(time*5.5*tscale+speed*0.7)* dir;',

		'	vec4 noise = ( texture2D( normalSampler, uv0-uv1 ) ) +',
        '		( texture2D( normalSampler, uv1-uv2 ) ) +',
        '		( texture2D( normalSampler, uv2-uv3) ) +',
		'		( texture2D( normalSampler, uv3-uv0 ) );',
		'	return (noise) * 0.5 - 1.0;',
		'}',
	
	//refleksjon og sollys
		'void sunLight( const vec3 surfaceNormal, const vec3 eyeDirection, float shiny, float spec, float diffuse, inout vec3 diffuseColor, inout vec3 specularColor )',
		'{',
		'	vec3 reflection = normalize( reflect( -sunDirection, surfaceNormal ) );',
		'	float direction = max( 0.0, dot( eyeDirection, reflection ) );',
		'	specularColor += pow( direction, shiny ) * sunColor * spec;',
		'	diffuseColor += max( dot( sunDirection, surfaceNormal ), 0.9 ) * sunColor * diffuse;',
		'}',
	
		'void main()',
		'{',
		'	vec4 noise = getNoise( worldPosition.xz );', //texture noise fra normalmap
		'	vec3 surfaceNormal = normalize( noise.xzy);',  // verdiene normaliseres og brukes som normal.

		'	vec3 diffuseLight = vec3(0.0);',
		'	vec3 specularLight = vec3(0.0);',

		'	vec3 worldToEye = eye-worldPosition;',
		'	float distance = length(worldToEye);',
		'	vec3 eyeDirection = normalize( worldToEye );',
		'	sunLight( surfaceNormal, eyeDirection, 100.0, 2.0, 0.05, diffuseLight, specularLight );',
		
		//forskyvelse i speilbilde, som følger mønster til bølgeligningen fra vertex.
		'	vec2 distortion = surfaceNormal.xz * ( 0.001 + 1.0 / distance ) * distortionScale*wave*0.06;',
		'	vec3 reflectionSample = vec3( texture2D( mirrorSampler, mirrorCoord.xy / mirrorCoord.z + distortion*wave*0.4 ) );',

		'	float theta = max( dot( eyeDirection, surfaceNormal ), 0.0 );',
		'	float rf0 = 0.3;',
		'	float reflectance = rf0 + ( 1.0 - rf0 ) * pow( ( 1.0 - theta ), 5.0 );',
		'	vec3 scatter = max( 12.0/*0.0*/, dot( surfaceNormal, eyeDirection ) ) * waterColor;',
		//samlet farge på vannet
		'	vec3 albedo = mix( sunColor * diffuseLight + scatter, ( vec3( 0.1 ) + reflectionSample + reflectionSample * specularLight ), reflectance );',
	
	


	//"vec3 vReflect;",
	"vec3 vRefract[3];",
	" float vReflectionFactor;",
	////////// fresnel refleksjon/refraksjon
			"vec3 I = worldPosition.xyz - cameraPosition;",

			"vec3 vReflect = reflect( I,surfaceNormal );",
		/*	"vRefract[0] = refract( normalize( I ),surfaceNormal, mRefractionRatio );",
			"vRefract[1] = refract( normalize( I ), surfaceNormal, mRefractionRatio * 0.99 );",
			"vRefract[2] = refract( normalize( I ),surfaceNormal, mRefractionRatio * 0.98 );",*/
			"vReflectionFactor = mFresnelBias + mFresnelScale * pow( 1.0 + dot( normalize( I ),  surfaceNormal ), mFresnelPower );",


			"vec4 reflectedColor = textureCube( tCube, vec3( vReflect.x, vReflect.yz ) );",
			"vec4 refractedColor = vec4( 1.0 );",

		/*	"refractedColor.r = textureCube( tCube, vec3( vRefract[0].x, -vRefract[0].yz ) ).r;",
			"refractedColor.g = textureCube( tCube, vec3( vRefract[1].x, -vRefract[1].yz ) ).g;",
			"refractedColor.b = textureCube( tCube, vec3( vRefract[2].x, -vRefract[2].yz ) ).b;",	*/	
/////////////////////////

			//////////// Blanding av albedo,fresnel 
			"vec4 finalColu = vec4(albedo,0.4)*vec4( reflectionSample, 1.0 )* mix( refractedColor, reflectedColor, clamp( vReflectionFactor, 1.0, 1.0 ) );",
		//	"if(finalColu.r < 0.002 && finalColu.g <  0.002 && finalColu.b <  0.002) discard;",
			"gl_FragColor = vec4( finalColu.xyz, alpha-0.3);",
		'}'
	].join('\n')

};

THREE.Mirror = function ( renderer, camera, options ) {


	////////////////////////////////////////////////////////
	//Stort sett samme oppsett som i mirror eksemplet, ikke tilført særlig under her
	///////////////////////////////////////////////////////

	THREE.Object3D.call( this );
	this.name = 'mirror_' + this.id;
	options = options || {};
	this.matrixNeedsUpdate = false;//true;
	var width = options.textureWidth !== undefined ? options.textureWidth : 512;
	var height = options.textureHeight !== undefined ? options.textureHeight : 512;
	this.clipBias = options.clipBias !== undefined ? options.clipBias : 0.0;	
	var mirrorColor = options.color !== undefined ? new THREE.Color(options.color) : new THREE.Color(0xffffff);

	this.renderer = renderer;
	this.mirrorPlane = new THREE.Plane();
	this.normal = new THREE.Vector3( 0, 0, 1 );
	this.mirrorWorldPosition = new THREE.Vector3();
	this.cameraWorldPosition = new THREE.Vector3();
	this.rotationMatrix = new THREE.Matrix4();
	this.lookAtPosition = new THREE.Vector3(0, 0, -1);
	this.clipPlane = new THREE.Vector4();
	
	if ( camera instanceof THREE.PerspectiveCamera ) {
		this.camera = camera;
	} else {
		this.camera = new THREE.PerspectiveCamera();
		console.log( this.name + ': camera is not a Perspective Camera!' );
	}

	this.textureMatrix = new THREE.Matrix4();
	this.mirrorCamera = this.camera.clone();
	this.texture = new THREE.WebGLRenderTarget( width, height );
	this.tempTexture = new THREE.WebGLRenderTarget( width, height );
	var mirrorShader = THREE.ShaderLib[ "mirror" ];
	var mirrorUniforms = THREE.UniformsUtils.clone( mirrorShader.uniforms );
	this.material = new THREE.ShaderMaterial( {
		fragmentShader: mirrorShader.fragmentShader,
		vertexShader: mirrorShader.vertexShader,
		uniforms: mirrorUniforms
	} );

	this.material.uniforms.mirrorSampler.value = this.texture;
	this.material.uniforms.mirrorColor.value = mirrorColor;
	this.material.uniforms.textureMatrix.value = this.textureMatrix;
	if ( !THREE.Math.isPowerOfTwo(width) || !THREE.Math.isPowerOfTwo( height ) ) {
		this.texture.generateMipmaps = false;
		this.tempTexture.generateMipmaps = false;
	}
	this.updateTextureMatrix();
	this.render();

};

THREE.Mirror.prototype = Object.create( THREE.Object3D.prototype );

///////////////////////render function
THREE.Mirror.prototype.render = function () {

	if ( this.matrixNeedsUpdate ) this.updateTextureMatrix();
	this.matrixNeedsUpdate = true;
	var scene = this;
	while ( scene.parent !== undefined ) {
		scene = scene.parent;
	}
	if ( scene !== undefined && scene instanceof THREE.Scene) {

		this.renderer.render( scene, this.mirrorCamera, this.texture, true );
	}
};

//////////////////////init object/////////
THREE.Water = function ( renderer, camera, scene, options ) {

	THREE.Object3D.call( this );
	this.name = 'water_' + this.id;

	function optionalParameter ( value, defaultValue ) {
		return value !== undefined ? value : defaultValue;
	};

	options = options || {};	
	this.matrixNeedsUpdate = true;
	var width = optionalParameter( options.textureWidth, 512 );
	var height = optionalParameter( options.textureHeight, 512 );
	this.clipBias = optionalParameter( options.clipBias, 0.0 );
	this.alpha = optionalParameter( options.alpha, 1.0 );
	this.time = optionalParameter( options.time, 0.0 );
	this.normalSampler = optionalParameter( options.waterNormals, null );
	this.normalSampler2 = optionalParameter( options.waterNormals2, null );
	this.tCube = optionalParameter( options.textureCube, null );
	this.sunDirection = optionalParameter( options.sunDirection, new THREE.Vector3( 0.70707, 0.70707, 0.0 ) );
	this.sunColor = new THREE.Color( optionalParameter( options.sunColor, 0xffffff ) );
	this.waterColor = new THREE.Color( optionalParameter( options.waterColor, 0x7F7F7F ) );
	this.eye = optionalParameter( options.eye, new THREE.Vector3( 0, 0, 0 ) );
	this.distortionScale = optionalParameter( options.distortionScale, 20.0 );

	this.renderer = renderer;
	this.scene = scene;
	this.mirrorPlane = new THREE.Plane();
	this.normal = new THREE.Vector3( 0, 0, 1 );
	this.mirrorWorldPosition = new THREE.Vector3();
	this.cameraWorldPosition = new THREE.Vector3();
	this.rotationMatrix = new THREE.Matrix4();
	this.lookAtPosition = new THREE.Vector3( 0, 0, -1 );
	this.clipPlane = new THREE.Vector4();
	
	if ( camera instanceof THREE.PerspectiveCamera )
		this.camera = camera;
	else 
	{
		this.camera = new THREE.PerspectiveCamera();
		console.log(this.name + ': camera is not a Perspective Camera!')
	}

	this.textureMatrix = new THREE.Matrix4();

	this.mirrorCamera = this.camera.clone();
	
	//brukes for å rendre til texture
	this.texture = new THREE.WebGLRenderTarget( width, height );
	this.tempTexture = new THREE.WebGLRenderTarget( width, height );
	
	var mirrorShader = THREE.ShaderLib[ "water" ];
	var mirrorUniforms = THREE.UniformsUtils.clone( mirrorShader.uniforms );

	this.material = new THREE.ShaderMaterial( { 
		fragmentShader: mirrorShader.fragmentShader, 
		vertexShader: mirrorShader.vertexShader, 
		uniforms: mirrorUniforms,
		transparent: true,
	//	wireframe:true
	} );
	this.material.uniforms.mirrorSampler.value = this.texture;
	this.material.uniforms.textureMatrix.value = this.textureMatrix;
	this.material.uniforms.alpha.value = this.alpha;
	this.material.uniforms.time.value = this.time;
	this.material.uniforms.normalSampler.value = this.normalSampler;
	this.material.uniforms.normalSampler2.value = this.normalSampler2;
	this.material.uniforms.sunColor.value = this.sunColor;
	this.material.uniforms.waterColor.value = this.waterColor;
	this.material.uniforms.sunDirection.value = this.sunDirection;
	this.material.uniforms.distortionScale.value = this.distortionScale;
	this.material.uniforms.tCube.value = this.tCube;	
	this.material.uniforms.eye.value = this.eye;
	
	if ( !THREE.Math.isPowerOfTwo(width) || !THREE.Math.isPowerOfTwo(height) )
	{
		this.texture.generateMipmaps = false;
		this.tempTexture.generateMipmaps = false;
	}

	this.updateTextureMatrix();
	this.render();
};

THREE.Water.prototype = Object.create( THREE.Mirror.prototype );


THREE.Water.prototype.updateTextureMatrix = function () {

	function sign(x) { return x ? x < 0 ? -1 : 1 : 0; }

	this.updateMatrixWorld();
	this.camera.updateMatrixWorld();

	this.mirrorWorldPosition.setFromMatrixPosition( this.matrixWorld );
	this.cameraWorldPosition.setFromMatrixPosition( this.camera.matrixWorld );

	this.rotationMatrix.extractRotation( this.matrixWorld );

	this.normal.set( 0, 0, 1 );
	this.normal.applyMatrix4( this.rotationMatrix );

	var view = this.mirrorWorldPosition.clone().sub( this.cameraWorldPosition );
	view.reflect( this.normal ).negate();
	view.add( this.mirrorWorldPosition );

	this.rotationMatrix.extractRotation( this.camera.matrixWorld );

	this.lookAtPosition.set(0, 0, -1);
	this.lookAtPosition.applyMatrix4( this.rotationMatrix );
	this.lookAtPosition.add( this.cameraWorldPosition );

	var target = this.mirrorWorldPosition.clone().sub( this.lookAtPosition );
	target.reflect( this.normal ).negate();
	target.add( this.mirrorWorldPosition );

	this.up.set(0, -1, 0);
	this.up.applyMatrix4( this.rotationMatrix );
	this.up.reflect( this.normal ).negate();

	this.mirrorCamera.position.copy( view );
	this.mirrorCamera.up = this.up;
	this.mirrorCamera.lookAt( target );
	this.mirrorCamera.aspect = this.camera.aspect;

	this.mirrorCamera.updateProjectionMatrix();
	this.mirrorCamera.updateMatrixWorld();
	this.mirrorCamera.matrixWorldInverse.getInverse(this.mirrorCamera.matrixWorld);

	//projeksjonsmatrise til speil-texture
	this.textureMatrix.set( 0.5, 0.0, 0.0, 0.5,
							0.0, 0.5, 0.0, 0.5,
							0.0, 0.0, 0.5, 0.5,
							0.0, 0.0, 0.0, 1.0 );
	this.textureMatrix.multiply(this.mirrorCamera.projectionMatrix);
	this.textureMatrix.multiply(this.mirrorCamera.matrixWorldInverse);
	this.mirrorPlane.setFromNormalAndCoplanarPoint( this.normal, this.mirrorWorldPosition );
	this.mirrorPlane.applyMatrix4(this.mirrorCamera.matrixWorldInverse);
	this.clipPlane.set(this.mirrorPlane.normal.x, this.mirrorPlane.normal.y, this.mirrorPlane.normal.z, this.mirrorPlane.constant );
	var q = new THREE.Vector4();
	var projectionMatrix = this.mirrorCamera.projectionMatrix;
	q.x = (sign(this.clipPlane.x) + projectionMatrix.elements[8]) / projectionMatrix.elements[0];
	q.y = (sign(this.clipPlane.y) + projectionMatrix.elements[9]) / projectionMatrix.elements[5];
	q.z = -1.0;
	q.w = (1.0 + projectionMatrix.elements[10]) / projectionMatrix.elements[14];

	var c = new THREE.Vector4();
	c = this.clipPlane.multiplyScalar( 2.0 / this.clipPlane.dot(q) );
	projectionMatrix.elements[2] = c.x;
	projectionMatrix.elements[6] = c.y;
	projectionMatrix.elements[10] = c.z + 0.99 - this.clipBias;
	projectionMatrix.elements[14] = c.w;
	
	var worldCoordinates = new THREE.Vector3();
	worldCoordinates.setFromMatrixPosition( this.camera.matrixWorld );
	this.eye = worldCoordinates;
	this.material.uniforms.eye.value = this.eye;
};
