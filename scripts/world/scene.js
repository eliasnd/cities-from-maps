import * as THREE from "/node_modules/three/build/three.module.js";
import { OrbitControls } from '/node_modules/three/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from '/node_modules/three/examples/jsm/loaders/OBJLoader.js';
import { building } from "./building.js";

let scene, camera, controls, renderer;

let rendererElement, mapElement, formElement;

init();

function init() {

	rendererElement = document.getElementById("threejs");
	mapElement = document.getElementById("map");
	formElement = document.getElementById("form-container");

	scene = new THREE.Scene();
	scene.background = new THREE.Color( 0xcce0ff );
	// scene.fog = new THREE.Fog( 0xcce0ff, 500, 10000 );

	scene.add( new THREE.AmbientLight( 0x666666 ) );
	scene.add( new THREE.DirectionalLight(0xffffff, 0.5));

	const groundTex = new THREE.TextureLoader().load( 'scripts/textures/grasstex.jpg' );
	groundTex.wrapS = THREE.RepeatWrapping;
	groundTex.wrapT = THREE.RepeatWrapping;
	groundTex.repeat.set(50, 50);
	const groundMaterial = new THREE.MeshLambertMaterial( { map: groundTex } );

	let ground = new THREE.Mesh( new THREE.PlaneBufferGeometry( 20000, 20000 ), groundMaterial );
	ground.position.y = 0;
	ground.rotation.x = - Math.PI / 2;
	ground.receiveShadow = true;
	scene.add( ground );

	camera = new THREE.PerspectiveCamera( 30, window.innerWidth / window.innerHeight, 1, 10000 );
	camera.position.set( 1000, 500, 0 );
	camera.lookAt(0, 0, 0);

	renderer = new THREE.WebGLRenderer();
	renderer.setSize( window.innerWidth, window.innerHeight );
	rendererElement.appendChild( renderer.domElement );

	controls = new OrbitControls(camera, renderer.domElement);
	animate();
}

function animate() {

	controls.update();
	requestAnimationFrame( animate );
	renderer.render(scene, camera);

}

export function loadMap(mapInfo) {
	var minHeight = 30;
	var maxHeight = 100;

	let windowStyles = [];
	let doorStyles = [];

	const manager = new THREE.LoadingManager();

	const loader = new OBJLoader(manager);
	loader.load('../objs/basic_window.obj', (obj) => { 
		// obj.scale.set(0.25, 0.25, 0.25);
		// obj.rotateX(90);
		windowStyles.push(obj); 
	});
	loader.load('../objs/door_high_poly.obj', (obj) => { doorStyles.push(obj); });

	var buildingTex = new THREE.TextureLoader(manager).load( 'scripts/textures/buildingtex.jpeg' );

	manager.onLoad = () => {
		buildingTex.wrapS = THREE.ClampToEdgeWrapping;
		buildingTex.wrapT = THREE.RepeatWrapping;
		let repeatX = 1;
		let repeatY = 1;
		buildingTex.repeat.set(repeatX, repeatY);
		buildingTex.offset.x = (repeatX - 1) / 2 * -1;

		for (var plot of mapInfo.plots) {
			
			let obj = building(plot.poly, windowStyles[0], doorStyles[0]);

			obj.position.set(plot.pos.x, 0, plot.pos.y);
			scene.add(obj);
		}

		rendererElement.style.display = "block";
		mapElement.style.display = "block";
		formElement.style.display = "none";

		console.log(scene);
	}
}