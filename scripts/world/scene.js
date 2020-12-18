import * as THREE from "/node_modules/three/build/three.module.js";
import { OrbitControls } from '/node_modules/three/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from '/node_modules/three/examples/jsm/loaders/OBJLoader.js';
import { EffectComposer } from '/node_modules/three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from '/node_modules/three/examples/jsm/postprocessing/RenderPass.js';
import { BloomPass } from '/node_modules/three/examples/jsm/postprocessing/BloomPass.js';
import { SSAOPass } from '/node_modules/three/examples/jsm/postprocessing/SSAOPass.js';

import * as Utils from "./utils.js";
import * as Geometry from "../geometry.js";
import { building } from "./building.js";

const container = document.getElementById("threejs");

const scene = new THREE.Scene();
scene.background = new THREE.Color( 0xcce0ff );
scene.add( new THREE.AmbientLight( 0x666666 ) );
scene.add( new THREE.DirectionalLight(0xffffff, 0.5));

const camera = new THREE.PerspectiveCamera( 30, window.innerWidth / window.innerHeight, 1, 10000 );
camera.position.set( 1000, 500, 0 );
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
container.appendChild( renderer.domElement );

const controls = new OrbitControls(camera, renderer.domElement);

// Post-processing 

const composer = new EffectComposer(renderer);
composer.setSize(renderer.domElement.width, renderer.domElement.height);

const renderPass = new RenderPass( scene, camera );
composer.addPass( renderPass );


// Ground

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

animate();

function animate() {

	controls.update();
	requestAnimationFrame( animate );
	composer.render();

}

export function loadMap(mapInfo) {
	var minHeight = 30;
	var maxHeight = 100;

	let windowStyles = [];
	let doorStyles = [];

	for (let plot of mapInfo.plots) {
		
		let obj = building(plot.poly, windowStyles[0], doorStyles[0]);

		obj.position.set(plot.pos.x, 0, plot.pos.y);
		scene.add(obj);
	}

	let sidewalkMat = new THREE.MeshLambertMaterial({color: 0x8c8c8c});
	let roadMat = new THREE.MeshLambertMaterial({color: 0x555555});

	for (let block of mapInfo.blocks) {
		let sidewalk = new THREE.Mesh(Utils.extrudePoly(block.poly.adjust(8), 2), sidewalkMat);
		sidewalk.position.set(block.pos.x, 0, block.pos.y);
		scene.add(sidewalk);	

		let road = new THREE.Mesh(Utils.extrudePoly(block.poly.adjust(30), 1), roadMat);
		road.position.set(block.pos.x, 0, block.pos.y);
		scene.add(road);
	}

	container.style.display = "block";
	document.getElementById("map").style.display = "block";
	document.getElementById("form-container").style.display = "none";

	console.log(scene);
}