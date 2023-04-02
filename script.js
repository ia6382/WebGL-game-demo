var scene, camera, renderer;

var controls;
var USE_WIREFRAME = false;

//nastavitve ekrana
var CAMERA_FOV = 80;
var WIDTH = window.innerWidth;
var HEIGHT = window.innerHeight;
var CAMERA_NEAR = 0.1;
var CAMERA_FAR = 1000;


//wireframe geometrije
var USE_WIREFRAME = false;

//pointer lock
var blocker = document.getElementById( 'blocker' );
var instructions = document.getElementById( 'instructions' );
//var overlayText=document.getElementById('overlayText');

//nastavitve igralca
var player = {
	speed: 500,
	height: 1.8,
	jumpVelocity: 90,
	mass: 30
};

//gravitacija
var gravity = 7.3;

//negativni pospešek drsenja, manjše številke = večje drsenje
var slideSpeed = 10.0;


var controlsEnabled = false;
var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var canJump = false;

var raycaster;
var prevTime = performance.now();
var velocity = new THREE.Vector3();	
var objects = [];
var victory=false;
var lost=false;

// Meshes index
var meshes = {};
var roka;
var HUD;

var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;

if ( havePointerLock ) {

	var element = document.body;

	var pointerlockchange = function ( event ) {

		if ( document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element ) {

			controlsEnabled = true;
			controls.enabled = true;

			blocker.style.display = 'none';

		} 
		
		else {

			controls.enabled = false;
			controlsEnabled = false;

			blocker.style.display = '-webkit-box';
			blocker.style.display = '-moz-box';
			blocker.style.display = 'box';

			instructions.style.display = '';

		}

	};

	var pointerlockerror = function ( event ) {

		instructions.style.display = '';

	};
	
	console.log("Adding event listeners");
	
	// Hook pointer lock state change events
	document.addEventListener( 'pointerlockchange', pointerlockchange, false );
	document.addEventListener( 'mozpointerlockchange', pointerlockchange, false );
	document.addEventListener( 'webkitpointerlockchange', pointerlockchange, false );

	document.addEventListener( 'pointerlockerror', pointerlockerror, false );
	document.addEventListener( 'mozpointerlockerror', pointerlockerror, false );
	document.addEventListener( 'webkitpointerlockerror', pointerlockerror, false );

	instructions.addEventListener( 'click', function ( event ) {
		prevTime = performance.now();
		instructions.style.display = 'none';

		// Ask the browser to lock the pointer
		element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;

		if ( /Firefox/i.test( navigator.userAgent ) ) {

			var fullscreenchange = function ( event ) {

				if ( document.fullscreenElement === element || document.mozFullscreenElement === element || document.mozFullScreenElement === element ) {

					document.removeEventListener( 'fullscreenchange', fullscreenchange );
					document.removeEventListener( 'mozfullscreenchange', fullscreenchange );
					element.requestPointerLock();
				}

			};

			document.addEventListener( 'fullscreenchange', fullscreenchange, false );
			document.addEventListener( 'mozfullscreenchange', fullscreenchange, false );

			element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen;

			element.requestFullscreen();

		} 
		
		else {

			element.requestPointerLock();

		}

	}, false );

} 

else {
	instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';
}
//vektorji za detekcijo 
var rays= [
      new THREE.Vector3(0, 0, 1),
      
      new THREE.Vector3(1, 0, 0),
      
      new THREE.Vector3(0, 0, -1),
      
      new THREE.Vector3(-1, 0, 0),
	  new THREE.Vector3(0, 1, 0)
    ];

var pLight, spotLight,lightning,composer,renderPass,effectFilm,controls,controls2,cloud,system1,geom;
var stats, clock, textureLoader;
var time2 = 0;	

	
function init(){
	console.log("init called");
	raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, -1 ,0 ), 0, 10 );
	raycasterDetection = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, 0, 0 ), 0, 5 ); 	
	
	narediSvet();
	
	//camera.lookAt(new THREE.Vector3(1,-1,0));
	
	renderer = new THREE.WebGLRenderer();
	renderer.setSize(window.innerWidth, window.innerHeight);

	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.BasicShadowMap;
	
	controls = new THREE.PointerLockControls( camera );
	
	scene.add( controls.getObject() );
	controls.getObject().translateX( 20 );
	controls.getObject().translateY( 160 );
	controls.getObject().translateZ( 50 );
	
	var onKeyDown = function ( event ) {

		switch ( event.keyCode ) {

			case 38: // up
			case 87: // w
				moveForward = true;
				break;

			case 37: // left
			case 65: // a
				moveLeft = true; 
				break;

			case 40: // down
			case 83: // s
				moveBackward = true;
				break;

			case 39: // right
			case 68: // d
				moveRight = true;
				break;

			case 32: // space
				if ( canJump === true ) 
				velocity.y += player.jumpVelocity;
				canJump = false;
				break;
		}

	};

	var onKeyUp = function ( event ) {

		switch( event.keyCode ) {

			case 38: // up
			case 87: // w
				moveForward = false;
				break;

			case 37: // left
			case 65: // a
				moveLeft = false;
				break;

			case 40: // down
			case 83: // s
				moveBackward = false;
				break;

			case 39: // right
			case 68: // d
				moveRight = false;
				break;

		}

	};

	document.addEventListener( 'keydown', onKeyDown, false );
	document.addEventListener( 'keyup', onKeyUp, false );
	
	window.addEventListener( 'resize', onWindowResize, false );
	
	document.body.appendChild(renderer.domElement);

	var system1;
	var cloud;
	var controls2 = new function () {
		this.size = 10;
		this.transparent = false;
		this.opacity = 0.6;
		this.color = 0xffffff;
		this.sizeAttenuation = false;
		this.redraw = function () {
			createPointCloud(controls2.size, controls2.transparent, controls2.opacity, controls2.sizeAttenuation, controls2.color);
			console.log("*")
		};
	};
    // controls2.redraw();
	
	animate();
}

function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}

function createPointCloud(size, transparent, opacity, sizeAttenuation, color) {
            var texture = textureLoader.load("./textures/raindrop-3.png");
            geom = new THREE.Geometry();
			
            var material = new THREE.PointsMaterial({
                size: size,
                transparent: transparent,
                opacity: opacity,
                map: texture,
                blending: THREE.AdditiveBlending,
                sizeAttenuation: sizeAttenuation,
                color: color
            });
			
            for (var i = 0; i < 3000; i++) {
                var particle = new THREE.Vector3(
                        getRandomArbitrary(-200, 200),
                        getRandomArbitrary(0, 250),
                        getRandomArbitrary(0, 250));
                particle.velocityY = 0.1 + Math.random() / 5;
                particle.velocityX = (Math.random() - 0.5) / 3;
				particle.velocityZ = 5 + Math.random()
                geom.vertices.push(particle);
            }
            cloud = new THREE.Points(geom, material);
            cloud.sortParticles = true;
            scene.add(cloud);
}

function initStats() {
	stats = new Stats();
	stats.setMode(0);
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.left = '0px';
	stats.domElement.style.top = '0px';
	document.getElementById("Stats-output").appendChild( stats.domElement );
	return stats;
}

function rotate(rad,vector){
		var x = Math.cos(rad) * vector.x  +Math.sin(rad) * vector.z;
		var z = -Math.sin(rad) * vector.x + Math.cos(rad) * vector.z;
		vector.x=x;
		vector.z=z;
		return vector;
}

var carOn = true;
var carOn2 = true;

function animate(){
	
	var intersections;
	meshes["hal"].rotation.y += 0.03
	
	requestAnimationFrame(animate);
	if (victory){
		blocker.style.display='';
		instructions.style.display='none';
		document.exitPointerLock();
		return;
	}
	if (lost){
		blocker.style.display='';
		overlayText.innerHTML="You lose!";
		instructions.style.display='none';
		document.exitPointerLock();
		return;
	}
	if ( controlsEnabled ) {
		//collision
		raycaster.ray.origin.copy( controls.getObject().position );
		raycaster.ray.origin.y -= player.height;

		intersections = raycaster.intersectObjects( objects );

		var isOnObject = intersections.length > 0;
		
		
		raycaster.ray.origin.copy( controls.getObject().position );
		raycaster.ray.origin.z -= player.height;
		
	

//ostalo *********************************************************************************
		var time = performance.now();
		var delta = ( time - prevTime ) / 1000;

		velocity.x -= velocity.x * slideSpeed * delta;
		velocity.z -= velocity.z * slideSpeed * delta;

		velocity.y -= gravity * player.mass * delta; //gravitacija

		if ( moveForward ) velocity.z -= player.speed * delta;
		if ( moveBackward ) velocity.z += player.speed * delta;
		if ( moveLeft ) velocity.x -= player.speed * delta;
		if ( moveRight ) velocity.x += player.speed * delta;

		if ( isOnObject === true ) {
			velocity.y = Math.max( 0, velocity.y );

			if (velocity.y == 0) canJump = true;
		}

		//detekcija colisionu
		raycasterDetection.ray.origin.copy( controls.getObject().position );		
		for (var i=0;i<rays.length;i++){
			raycasterDetection.ray.direction.copy(rays[i]);   
			raycasterDetection.ray.direction=rotate(controls.getObject().rotation.y%(Math.PI*2),raycasterDetection.ray.direction); //			
			var collisionDetection=raycasterDetection.intersectObjects( objects );

			if(collisionDetection.length!=0){
				if(i==0){
					velocity.z=Math.min(velocity.z,-3);
				}
				if(i==1){
					velocity.x=Math.min(velocity.x,-3);
				}
				if(i==2){
					velocity.z=Math.max(velocity.z,3);
				}
				if(i==3){
					velocity.x=Math.max(velocity.x,3);
				}
				if(i==4){
					velocity.y=-20;
				}
				for (var j=0;j<collisionDetection.length;j++){
					if (collisionDetection[j].object.name=="hal"){
						controlsEnabled=false;
						victory=true;
					}
				}
			}
			
			
		}
		
		controls.getObject().translateX( velocity.x * delta );
		controls.getObject().translateY( velocity.y * delta );
		controls.getObject().translateZ( velocity.z * delta );
		
		if (controls.getObject().position.y <40){
			controlsEnabled=false;
			lost=true;
		}
		

		prevTime = time;

	}


	time2++;
	/*var vertices = cloud.geometry.vertices;
    vertices.forEach(function(v) {
		v.y -= 1;
		if (v.y < 0) v.y = 100;
	});*/
	
	downLight.position.z -=  1
	if(downLight.position.z < 0){
		downLight.position.z = 800 + 200*Math.sin(Math.random()*Math.PI);
		downLight.color.setHex( Math.random() * 0xffffff );
		downLight.intensity = 0;
		carOn = false;
	}else if(downLight.position.z <= 500 && !carOn){
		downLight.intensity = 2;
		carOn = true;
	}
	//traffic up
	upLight.position.z -=  1
	if(upLight.position.z < -50){
		upLight.position.z = 800 + 200*Math.sin(Math.random()*Math.PI);
		upLight.color.setHex( Math.random() * 0xffffff );
		upLight.intensity = 0;
		carOn2 = false;
	}else if(upLight.position.z <= 500 && !carOn2){
		upLight.intensity = 2;
		carOn2 = true;
	}

	renderer.render(scene, camera);
}


function narediSvet(){
	
	var meshFloor, ambientLight, light;
	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera(CAMERA_FOV, WIDTH/HEIGHT, CAMERA_NEAR, CAMERA_FAR);
	camera.position.set(1, 1.8, 1);

	//Static Lights
	ambientLight = new THREE.AmbientLight(0x29a7ff, 1); //<-----spremeni ce dodajes svetlobo/luci (sedaj je povsod svetloba jakosti 2)
	scene.add(ambientLight);
	var lightning = new THREE.HemisphereLight( 0x29a7ff, 0x752aff, 0.5);
	scene.add( lightning );
	
	downLight = new THREE.SpotLight( 0xffffff);
	downLight.position.set( 0, 20, 200 );
	downLight.castShadow = true;
	downLight.intensity = 2;
	downLight.penumbra = 0.4;
	downLight.shadow.mapSize.width = 1024;
	downLight.shadow.mapSize.height = 1024;
	downLight.shadow.camera.near = 500;
	downLight.shadow.camera.far = 4000;
	downLight.shadow.camera.fov = 100;
	downLight.castShadow = true;
	scene.add( downLight );
	
	var spotLightHelper = new THREE.SpotLightHelper( downLight );
	
	upLight = downLight.clone();
	upLight.position.set( 0, 250, 0 );
	var spotLightHelper2 = new THREE.SpotLightHelper( upLight );
	scene.add(upLight)
	
	
	//ˇtako dodajas tockasto svetlobo
	light = new THREE.PointLight(0xffffff, 50, 50);
	light.position.set( 0, 250, 0);
	light.castShadow = true;
	light.shadow.camera.near = 0.1;
	light.shadow.camera.far = 25;
	
	//Other stuff
	scene.fog = new THREE.Fog(0x1d2a30,90,400);
	
	// Texture Loading
	textureLoader = new THREE.TextureLoader();
	skyTexture = textureLoader.load("textures/skyT.png");
	tlaTexture = textureLoader.load("textures/tla1.png");
	balkonTexture = textureLoader.load("textures/balkonT.png");
	balkonBump = textureLoader.load("textures/balkonBump.png");
	mostTexture = textureLoader.load("textures/mostT.png");
	mostBump = textureLoader.load("textures/mostBump.png");
	stavba1Texture = textureLoader.load("textures/texturaCrte.png");
	stavba1Bump = textureLoader.load("textures/bumpCrte.png");
	stavba2Texture = textureLoader.load("textures/texturaMala.png");
	stavba3Texture = textureLoader.load("textures/texturaObicna.png");
	stavba4Texture = textureLoader.load("textures/texturaStolpci.png");
	stavba5Texture = textureLoader.load("textures/texturaVisoka.png");
	kulisaTexture = textureLoader.load("textures/back.png");
	halTexture = textureLoader.load("textures/texturaHal.png");
	halBump = textureLoader.load("textures/bumpHal.png");
	
	//NAREDI KULISE IN TLA
	//tla
	meshFloor = new THREE.Mesh(
		new THREE.PlaneGeometry(80,330, 10,30),
		new THREE.MeshPhongMaterial({color:0x252526, map:tlaTexture})
	);
	meshFloor.position.z += 140;
	meshFloor.rotation.x -= Math.PI / 2;
	meshFloor.receiveShadow = true;
	scene.add(meshFloor);
	
	meshSky = new THREE.Mesh(
		new THREE.PlaneGeometry(400,400, 10,30),
		new THREE.MeshPhongMaterial({color:0x2b4c77, map:skyTexture})
	);
	meshSky.position.z += 140;
	meshSky.position.y += 400;
	meshSky.rotation.x += Math.PI/2;
	scene.add(meshSky);
	
	//kulisa levo
	meshLeft = new THREE.Mesh(
		new THREE.PlaneGeometry(400,330, 10,30),
		new THREE.MeshPhongMaterial({color:0x366abc, map:kulisaTexture})
	);
	meshLeft.position.z += 140;
	meshLeft.position.x += 40;
	meshLeft.position.y += 400/2;
	meshLeft.rotation.y -= Math.PI/2;
	meshLeft.rotation.z -= Math.PI/2;
	scene.add(meshLeft);
	objects.push(meshLeft);
	//kulisa desno
	meshRight = new THREE.Mesh(
		new THREE.PlaneGeometry(400,330, 10,30),
		new THREE.MeshPhongMaterial({color:0x366abc, map:kulisaTexture})
	);
	meshRight.position.z += 140;
	meshRight.position.x -= 40;
	meshRight.position.y += 400/2;
	meshRight.rotation.y += Math.PI/2;
	meshRight.rotation.z -= Math.PI/2;
	scene.add(meshRight);
	objects.push(meshRight);
	//kulisa zadaj
	meshBack = new THREE.Mesh(
		new THREE.PlaneGeometry(400,80, 10,30),
		new THREE.MeshPhongMaterial({color:0x366abc, map:kulisaTexture})
	);
	meshBack.position.z -= 22;
	meshBack.position.y += 400/2;
	meshBack.rotation.z -= Math.PI/2;
	scene.add(meshBack);
	objects.push(meshBack);
	//kulisa spredaj
	meshFront = new THREE.Mesh(
		new THREE.PlaneGeometry(400,80, 10,30),
		new THREE.MeshPhongMaterial({color:0x366abc, map:kulisaTexture})
	);
	meshFront.position.z += 300;
	meshFront.position.y += 400/2;
	meshFront.rotation.y += Math.PI;
	meshFront.rotation.z -= Math.PI/2;
	scene.add(meshFront);
	objects.push(meshFront);
	
	//NAREDI OBJEKTE

	// Create mesh with these textures STAVBA1
	stavba1 = new THREE.Mesh(
		new THREE.BoxGeometry(6,150,50),
		new THREE.MeshPhongMaterial({
			//color:0xfcadff,
			map:stavba1Texture,
			//bumpMap:stavba1Bump,
			
		})
	);
	stavba1.traverse(function(node){
		if( node instanceof THREE.Mesh ){
			node.castShadow = true;
			node.receiveShadow = true;
		}
	});	
	
	
	// Create mesh with these textures STAVBA2
	stavba2 = new THREE.Mesh(
		new THREE.BoxGeometry(50,170,6),
		new THREE.MeshPhongMaterial({
			//color:0x366abc,
			map:stavba2Texture,
			
		})
	);
	stavba2.traverse(function(node){
		if( node instanceof THREE.Mesh ){
			node.castShadow = true;
			node.receiveShadow = true;
		}
	});
	
	
	// Create mesh with these textures STAVBA3
	stavba3 = new THREE.Mesh(
		new THREE.BoxGeometry(20,180,90),
		new THREE.MeshPhongMaterial({
			map:stavba3Texture,
			
		})
	);
	stavba3.traverse(function(node){
		if( node instanceof THREE.Mesh ){
			node.castShadow = true;
			node.receiveShadow = true;
		}
	});
	
	
	// Create mesh with these textures STAVBA4
	stavba4 = new THREE.Mesh(
		new THREE.BoxGeometry(80,200,10),
		new THREE.MeshPhongMaterial({
			//color:0xb0ffad,
			map:stavba4Texture,
			
		})
	);
	stavba4.traverse(function(node){
		if( node instanceof THREE.Mesh ){
			node.castShadow = true;
			node.receiveShadow = true;
		}
	});
	
	
	// Create mesh with these textures STAVBA5
	stavba5 = new THREE.Mesh(
		new THREE.BoxGeometry(80,200,10),
		new THREE.MeshPhongMaterial({
			//color:0x7ff8ff,
			map:stavba5Texture,
			
		})
	);
	stavba5.traverse(function(node){
		if( node instanceof THREE.Mesh ){
			node.castShadow = true;
			node.receiveShadow = true;
		}
	});
	
	
	
	// Create mesh with these textures BALKON
	balkon = new THREE.Mesh(
		new THREE.BoxGeometry(20,5,50),
		new THREE.MeshPhongMaterial({
			map:balkonTexture,
			bumpMap:balkonBump,
		})
	);
	balkon.traverse(function(node){
		if( node instanceof THREE.Mesh ){
			node.castShadow = true;
			node.receiveShadow = true;
		}
	});
	
	
	// Create mesh with these textures MOST
	most = new THREE.Mesh(
		new THREE.BoxGeometry(80,15,10),
		new THREE.MeshPhongMaterial({
			map:mostTexture,
			bumpMap:mostBump,
			
		})
	);
	most.traverse(function(node){
		if( node instanceof THREE.Mesh ){
			node.castShadow = true;
			node.receiveShadow = true;
		}
	});
	
	
	// Create mesh with these textures HAL
	hal = new THREE.Mesh(
		new THREE.BoxGeometry(3,4,3),
		new THREE.MeshPhongMaterial({
			map:halTexture,
			bumpMap:halBump,
		})
	);
	most.traverse(function(node){
		if( node instanceof THREE.Mesh ){
			node.castShadow = true;
			node.receiveShadow = true;
		}
	});
	
	 //POSTAVI OBJEKTE V SVET, NAREDI SVET
	// Clone models into meshes
	meshes["stavba1"] = stavba1;
	meshes["stavba2"] = stavba2;
	meshes["stavba3"] = stavba3;
	meshes["stavba4"] = stavba4;
	meshes["stavba5"] = stavba1.clone();
	meshes["stavba6"] = stavba3.clone();
	meshes["stavba7"] = stavba1.clone();
	meshes["stavba8"] = stavba5;
	meshes["balkon1"] = balkon;
	meshes["balkon2"] = balkon.clone();
	meshes["balkon3"] = balkon.clone();
	meshes["balkon4"] = balkon.clone();
	meshes["most1"] = most;
	meshes["hal"] = hal;
	
	// Reposition individual meshes, then add meshes to scene
	meshes["stavba1"].position.set(-40, +150/2, +5);
	scene.add(meshes["stavba1"]);
	objects.push(meshes["stavba1"]);
	
	meshes["stavba2"].position.set(-10, +170/2, -22);
	scene.add(meshes["stavba2"]);
	objects.push(meshes["stavba2"]);
	
	meshes["stavba3"].position.set(-38, +180/2, +120);
	scene.add(meshes["stavba3"]);
	objects.push(meshes["stavba3"]);
	
	meshes["stavba4"].position.set(+5, +200/2, +300);
	scene.add(meshes["stavba4"]);
	objects.push(meshes["stavba4"]);
	
	meshes["stavba5"].position.set(-40, +150/2, +200);
	scene.add(meshes["stavba5"]);
	objects.push(meshes["stavba5"]);
	
	meshes["stavba6"].position.set(+38, +180/2, +20);
	meshes["stavba6"].scale.set(1,1,1);
	scene.add(meshes["stavba6"]);
	objects.push(meshes["stavba6"]);
	
	meshes["stavba7"].position.set(+40, +150/2, +120);
	meshes["stavba7"].scale.set(4,1,2);
	scene.add(meshes["stavba7"]);
	objects.push(meshes["stavba7"]);
	
	meshes["stavba8"].position.set(+37, +300/2, 270);
	meshes["stavba8"].scale.set(1,2,5);
	meshes["stavba8"].rotation.y = -Math.PI/2;
	scene.add(meshes["stavba8"]);
	objects.push(meshes["stavba8"]);
	
	meshes["balkon1"].position.set(+25, +100, +20);
	meshes["balkon1"].scale.set(1,1,1.7);
	scene.add(meshes["balkon1"]);
	objects.push(meshes["balkon1"]);
	
	meshes["balkon2"].position.set(+25, +110, +98);
	scene.add(meshes["balkon2"]);
	objects.push(meshes["balkon2"]);
	
	meshes["most1"].position.set(+0, +80, +110);
	meshes["balkon1"].scale.set(1,1,1.7);
	scene.add(meshes["most1"]);
	objects.push(meshes["most1"]);
	
	meshes["balkon3"].position.set(-25, +80, +150);
	meshes["balkon3"].scale.set(1,1,0.7);
	scene.add(meshes["balkon3"]);
	objects.push(meshes["balkon3"]);
	
	meshes["balkon4"].position.set(-30, +90, +200);
	scene.add(meshes["balkon4"]);
	objects.push(meshes["balkon4"]);
	
	meshes["hal"].position.set(-30,110,210);
	meshes["hal"].name="hal";
	scene.add(meshes["hal"]);
	objects.push(meshes["hal"]);
	
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );
}

window.onload = init();
