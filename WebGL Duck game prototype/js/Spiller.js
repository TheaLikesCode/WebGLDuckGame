


var mesh;
var timer = 0.0;


function Spiller(){

	this.init();
}

Spiller.prototype.constructor = Spiller;

Spiller.prototype.init = function(){

	cubeGeo = new THREE.BoxGeometry(1000,500,1000);
	vingeSegment1Geo = new THREE.BoxGeometry(400,500,100);
	sphereGeo = new THREE.SphereGeometry( 500, 32, 32 );
	cylinderGeo = new THREE.CylinderGeometry(50, 400, 2)

	feathers = THREE.ImageUtils.loadTexture("textures/Feathers.png");
	feathers.repeat.set(0.3,0.3);

	spillerCubeBodyMat = new THREE.MeshPhongMaterial({color:0xffff00 , map:feathers}); 

	spillerBeakMat = new THREE.MeshPhongMaterial({color:0xF09D1D,envMap:cubeMap, shininess:11.0,reflectivity:0.2});
	spillerEyesMat = new THREE.MeshPhongMaterial({color:0x000000 ,envMap:cubeMap, shininess:30.0,reflectivity:0.2});

	spillerCubeBody = new THREE.Mesh( sphereGeo, spillerCubeBodyMat);
	spillerCubeBody.position.set(500,1200,500);
	spillerCubeBody.scale.set(0.1,0.1,0.1);
	spillerCubeBody.name = "playerBody";
	spillerCubeBody.geometry.computeBoundingSphere();

	spillerCubeHead = new THREE.Mesh( sphereGeo, spillerCubeBodyMat);
	spillerCubeHead.position.set(500,550,0);
	spillerCubeHead.scale.set(0.8,0.8,0.8);
	spillerCubeHead.name = "playerHead";
	spillerCubeHead.geometry.computeBoundingSphere();

	//Nebb
	spillerHeadNebbTopp = new THREE.Mesh( cylinderGeo, spillerBeakMat);
	spillerHeadNebbTopp.position.set(300,-100,0) ;

	spillerCubeHead.add(spillerHeadNebbTopp); //add to head

	spillerHeadNebbBot = spillerHeadNebbTopp.clone();
	spillerHeadNebbBot.rotation.set(0,0,-35);
	spillerHeadNebbBot.position.set(150,-200,0); 

	spillerCubeHead.add(spillerHeadNebbBot); //add to head

	//Øyer
	spillerHeadRightEye = new THREE.Mesh( sphereGeo, spillerEyesMat);
	spillerHeadRightEye.position.set(300,50,100) ;
	spillerHeadRightEye .scale.set(0.4,0.5,0.4);

	spillerCubeHead.add(spillerHeadRightEye); //add to head

	spillerHeadLeftEye = spillerHeadRightEye.clone();
	spillerHeadLeftEye.position.set(300,50,-100) ;
	spillerHeadLeftEye .scale.set(0.4,0.5,0.4);

	spillerCubeHead.add(spillerHeadLeftEye); //add to head
	spillerCubeBody.add(spillerCubeHead); //add head to body

	//Høyre Vinge
	spillerHøyreVingeLedd1 = new THREE.Mesh( vingeSegment1Geo, spillerCubeBodyMat);
	spillerHøyreVingeLedd1.position.set(0,300, 500);
	spillerHøyreVingeLedd1.rotation.x += Math.PI/4;
	spillerHøyreVingeLedd1.rotation.z += Math.PI/2;
	spillerHøyreVingeLedd1.name = "playerRightWingLedd1";
	spillerHøyreVingeLedd1.geometry.computeBoundingSphere();

	spillerHøyreVingeLedd2 = spillerHøyreVingeLedd1.clone();
	spillerHøyreVingeLedd2.position.set(-350,0,0);
	spillerHøyreVingeLedd2.name = "playerRightWingLedd2";
	spillerHøyreVingeLedd2.geometry.computeBoundingSphere();

	//Venstre vinge
	spillerVenstreVingeLedd1 = new THREE.Mesh( vingeSegment1Geo, spillerCubeBodyMat);
	spillerVenstreVingeLedd1.rotation.x -= Math.PI/4;
	spillerVenstreVingeLedd1.rotation.z -= Math.PI/2;
	spillerVenstreVingeLedd1.position.set(0,300,-500);
	spillerVenstreVingeLedd1.name = "playerLeftWingLedd1";
	spillerVenstreVingeLedd1.geometry.computeBoundingSphere();

	spillerVenstreVingeLedd2 = new THREE.Mesh( vingeSegment1Geo, spillerCubeBodyMat); 
	spillerVenstreVingeLedd2.position.set(-350,0,0);
	spillerHøyreVingeLedd2.rotation.set(0,0, 0);
	spillerVenstreVingeLedd2.name = "playerLeftWingLedd2";
	spillerVenstreVingeLedd2.geometry.computeBoundingSphere();

	spillerHøyreVingeLedd1.add(spillerHøyreVingeLedd2); //Legge ytre vingeledd til indre vingeledd
	spillerCubeBody.add(spillerHøyreVingeLedd1); //Legge høyre vinge til i body

	spillerVenstreVingeLedd1.add(spillerVenstreVingeLedd2); //Legge ytre vingeledd til indre vingeledd
	spillerCubeBody.add(spillerVenstreVingeLedd1); //Legge venstre vinge til i body

	spillerCubeBody.position.set(0,0,-1000);
	scene.add(spillerCubeBody);

	this.velocity = new THREE.Vector3(0,0,0);
	this.posisjon = new THREE.Vector3(0,0,0);
	this.oldPosition = new THREE.Vector3(0,0,0);
	this.rotasjon = new THREE.Vector3(1,0,1);
	this.posisjon = spillerCubeBody.position;

	this.jumpSpeed = 18;

	this.headPosition = spillerCubeHead.position;

	this.speedConst = 0.0;
	this.baseRot = 0.0;
	this.headRot = 0.0;
	this.bodyRot = 0.0;
	this.forward = this.backward = this.turnLeft= this.turnRight= this.jump = this.harBakkeKontakt=this.erpavannet;


}

Spiller.prototype.update = function(delta, elapsedTime){

	if (this.velocity.y>this.jumpSpeed)
		this.velocity.y = this.jumpSpeed; //ikke la fart overstige max

	collisionTestMesh(spillerCubeBody); //Kollisjonstest

	var gravity = 8;
	timer +=  0.2;

	//Er på vannet
	if(this.posisjon.y<=0){ 
	this.harBakkeKontakt = true;
	this.velocity.y=0;
	this.erpavannet = true;
	this.speedConst=3;
	}

	//gravitasjon	
	if(!this.harBakkeKontakt && this.posisjon.y > 0){
	gravitasjonTimer += gravity*delta;
	this.velocity.y -= gravitasjonTimer;


	if(this.velocity.y != 0){ //Flyr eller faller

		if (this.speedConst >= 3) 
					this.speedConst=3;

		//Flakse med vingene
		if(spillerHøyreVingeLedd1.rotation.x > -3*Math.PI/2 && spillerHøyreVingeLedd1.rotation.x < Math.PI/2){
			//Høyre vinge
			spillerHøyreVingeLedd1.rotation.y = -Math.PI/4 - Math.cos(timer)*0.5;  //Ledd 1
			spillerHøyreVingeLedd1.rotation.x = -Math.PI/2 + Math.cos(timer); //Ledd 1
			
			spillerHøyreVingeLedd2.rotation.y = -Math.PI + Math.sin(timer); //Ledd 2
			spillerHøyreVingeLedd1.rotation.y -= Math.PI; //Ledd 1

			//Venstre vinge
			spillerVenstreVingeLedd1.rotation.y = -Math.PI/4 - Math.cos(timer)*0.5; //Ledd 1
			spillerVenstreVingeLedd1.rotation.x = -Math.PI/2 - Math.cos(timer); //Ledd1
			spillerVenstreVingeLedd2.rotation.y = -Math.PI - Math.sin(timer); //Ledd 2
		}
	}
}

	//fremover
	if(this.forward){ //når spilleren trykker W
		this.speedConst += 0.05; //aksellererer med 0.5	

		if (this.harBakkeKontakt){
			spillerCubeHead.position.x = 500+ Math.cos(timer)*100; //Vippe med hodet

			if(!this.erpavannet){
				if (this.speedConst >= 2)
					this.speedConst=2;
			}	else {
					if (this.speedConst >= 3)
						this.speedConst=3;
				}
		}

		this.velocity.x += Math.cos(this.getRotationAngleUsingAtan2())*this.speedConst;
		this.velocity.z -= Math.sin(this.getRotationAngleUsingAtan2())*this.speedConst;
	}


	//friksjon
	if((!this.forward||!this.backward) && (this.speedConst >0||this.speedConst <0) ){
		this.velocity.x*=0.85;
		this.velocity.z*=0.85;
	}

	//bakover
	if(this.backward){//Spilleren trykker S
		this.speedConst+=0.4;

		if ( this.speedConst>=3)
		 this.speedConst = 3;		

		this.velocity.x -= Math.cos(this.getRotationAngleUsingAtan2())*this.speedConst;
		this.velocity.z += Math.sin(this.getRotationAngleUsingAtan2())*this.speedConst;
	}

	//hoppe
	if(this.jump){	//Spilleren trykker Space
		this.velocity.y = this.jumpSpeed;
		gravitasjonTimer=0.5;
		this.jump=false;
	}

	//Right
	if(this.turnRight){ //Spilleren trykker D
	matrix = new THREE.Matrix4().makeRotationAxis( new THREE.Vector3( 0, 1, 0 ), -Math.PI/100 );
	this.rotasjon.applyMatrix4( matrix );	   


	}
	//Left
	if(this.turnLeft){  //Spilleren trykker A
	matrix = new THREE.Matrix4().makeRotationAxis( new THREE.Vector3( 0, 1, 0 ), Math.PI/100 );
	this.rotasjon.applyMatrix4( matrix );	   
	}


	this.oldPosition.y = spillerCubeBody.position.y;
	this.oldPosition.x = spillerCubeBody.position.x;
	this.oldPosition.z = spillerCubeBody.position.z;

	spillerCubeBody.rotation.y = this.getRotationAngleUsingAtan2();

	spillerCubeBody.position.y+=this.velocity.y;
	spillerCubeBody.position.z+= this.velocity.z;
	spillerCubeBody.position.x+= this.velocity.x;

	spillerCubeBody.updateMatrixWorld();

}

Spiller.prototype.getRotationAngleUsingAtan2 = function ()
{
	return Math.atan2(this.rotasjon.x,this.rotasjon.z) /*- Math.PI / 2*/;
};

 
