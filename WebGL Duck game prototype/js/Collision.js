
var directionVector;
var ray;
var collisionResults;
var collidableMeshList = [];

function collisionTestMesh(_mesh) {

 spilleren.harBakkeKontakt = false;
	if (coarseCollisionTest(_mesh, collidableMeshList) )	//grovsjekk
		fineCollisionTest(_mesh, collidableMeshList);  //finsjekk 	
	
}



function coarseCollisionTest(_mesh1, _collidableMeshList) {
	var _mesh2 = undefined;

	for (var modelIndex = 0; modelIndex < _collidableMeshList.length; modelIndex++) {
		_mesh2 = _collidableMeshList[modelIndex];
		
		var mesh1Position = new THREE.Vector3(); 
		mesh1Position.setFromMatrixPosition( _mesh1.matrixWorld );	//Henter posisjonsvektoren fra world-matrisa.
	
		var mesh2Position = new THREE.Vector3();
		mesh2Position.setFromMatrixPosition( _mesh2.matrixWorld );	//Henter posisjonsvektoren fra world-matrisa.
		
		var distanceVector = mesh1Position.sub(mesh2Position);		//Finner vektoren mellom posisjonene.
		var distance = distanceVector.length();						//Beregner lengden på vektoren.
		var r1plussr2 = _mesh1.geometry.boundingSphere.radius + _mesh2.geometry.boundingSphere.radius;	//Beregner summen av radiusene.
		if (distance < r1plussr2) 									//Sjekker!
			return true;
	}
	return false;
}

//basert på koder fra: http://stackoverflow.com/questions/11473755/how-to-detect-collision-in-three-js

function fineCollisionTest(_mesh, _collidableMeshList) {
			
	
	//var originPoint = _mesh.parent.position.clone();  //Returnerer mesh-objektet (Object3D) f.eks. når _mesh=cockpit. 
	//Gjennomløper alle vertekser til meshet:
	for ( vertexIndex = 0; vertexIndex < _mesh.geometry.vertices.length; vertexIndex++)
	{	
		//Modell/lokale koordinater for meshets vertekser:
		localVertex = _mesh.geometry.vertices[vertexIndex].clone();
		//Transformerer modellkoordinat vha. meshets matrise: 
		globalVertex = localVertex.applyMatrix4(_mesh.matrixWorld);
		//Lager en retningsvektor, en RAY, fra meshets posisjon (globale koordinater) til transformert verteks:
	    meshPosition = new THREE.Vector3();
		meshPosition.setFromMatrixPosition( _mesh.matrixWorld );	//Henter posisjonsvektoren fra world-matrisa.
		directionVector = globalVertex.sub( meshPosition );
		
		//Lager et Raycaster-objekt vha. 
		ray = new THREE.Raycaster( meshPosition /*originPoint*/, directionVector.clone().normalize()); //fra, retning
		
		//Returnerer en liste med objekter som mesh kolliderer med (nærmeste først):
		collisionResults = ray.intersectObjects( _collidableMeshList );


			if ( collisionResults.length > 0 && collisionResults[0].distance < directionVector.length() +40) {

				spilleren.harBakkeKontakt = true;

				//faller
				if(directionVector.y <= 0 && spilleren.velocity.y !=0){ 
					gravitasjonTimer = 0.0;
					spilleren.velocity.y=0;
				}	

				if(collisionResults[0].object.name == 'Felle2'){
					if(spilleren.posisjon.y < felleCube2.position.y + 100)
						spilleren.posisjon.y = felleCube2.position.y+100;

				}
					
				//Sidevegger på bokser
				if(directionVector.y > 0){ 				
				spilleren.velocity.x *= -0.8;
				spilleren.velocity.y *= -0.2;
				spilleren.velocity.z *= -0.8;

					if(collisionResults[0].object.name == 'Felle'){
						if(spilleren.posisjon.z < felleCube1.position.z + 150)
									spilleren.posisjon.z = felleCube1.position.z-200;

						if(spilleren.posisjon.z > felleCube1.position.z - 150)
								spilleren.posisjon.z = felleCube1.position.z + 200;	
					}
				
				}
				_mesh.position.x += spilleren.velocity.x*2;
				_mesh.position.y -= spilleren.velocity.y;	

				return true;
			}
		}
		
	return false;
}
