import * as THREE from "/node_modules/three/build/three.module.js";
import * as Utils from "./utils.js";
import * as Geometry from "../geometry.js";

const minBuildingHeight = 20;
const maxBuildingHeight = 60;

// Height of ground section. Contains door and can be visually distinct from upper section
const minGroundHeight = 5;
const maxGroundHeight = 10;

const minRoofHeight = 3;
const maxRoofHeight = 6;

// Vertical segments -- floors
const minVSegSize = 5;
const maxVSegSize = 10;

// Horizontal segments -- windows
const minHSegSize = 5;
const maxHSegSize = 10;

const windowMat = new THREE.MeshPhongMaterial({shininess: 100, color: 0xe1eff5});

const roofColors = [0xc0c2a5, 0xdbe3d5, 0xa9bdcc];
const midColors = [0x8c6d57, 0xbfbfbf, 0x616769, 0x999999, 0xa36240, 0xd4c081, 0xe3decc];
const groundColors = [0x7c8b91, 0xa6a6a6, 0x524642];

var params = {
	vSegSize: null,
	hSegSize: null,
	windowStyle: null,
	doorStyle: null
}

export function building(poly, windowStyle, doorStyle) {
	let height = Utils.randRange(minBuildingHeight, maxBuildingHeight);
	let groundHeight = Utils.randRange(minGroundHeight, Math.min(maxGroundHeight, minBuildingHeight));
	let roofHeight = Utils.randRange(minRoofHeight, maxRoofHeight);

	params.vSegSize = Math.floor(Utils.randRange(minVSegSize, maxVSegSize));
	params.hSegSize = Math.floor(Utils.randRange(minHSegSize, maxHSegSize));
	params.windowStyle = windowStyle;
	params.doorStyle = doorStyle;

	let gMesh = groundSection(poly, groundHeight);
	let mMesh = middleSection(poly, height);
	mMesh.translateY(groundHeight);
	let rMesh = roofSection(poly, roofHeight);
	rMesh.translateY(height+groundHeight);

	let final = new THREE.Group();
	final.add(gMesh);
	final.add(mMesh);
	final.add(rMesh);
	// let final = Utils.mergeGeometries(groundGeom, upperGeom);
	return final;
}

function groundSection(poly, height) {
	let mat = new THREE.MeshLambertMaterial({color: groundColors[Math.floor(Utils.randRange(0, groundColors.length))]});

	let result = new THREE.Group();

	for (var edge of poly.edges)
		result.add(singleWall(edge, height, mat));
	
	return result;
}

function middleSection(poly, height) {
	let mat = new THREE.MeshLambertMaterial({color: midColors[Math.floor(Utils.randRange(0, midColors.length))]});

	let result = new THREE.Group();

	poly.edges.map(edge => { result.add(segmentedWall(edge, height, mat)); });
	// poly.edges.map(edge => { result.add(singleWall(edge, height, mat)); });

	return result;
}

function roofSection(poly, height) {
	// let mat = new THREE.MeshLambertMaterial({color: 0xf5dd42});
	let mat = new THREE.MeshLambertMaterial({color: roofColors[Math.floor(Utils.randRange(0, roofColors.length))]});

	let result = new THREE.Group();

	// for (var edge of poly.edges)
		// result.add(singleWall(edge, height, mat));

	let roofGeom = Utils.extrudePoly(poly.adjust(1), height);
	// roofGeom.translate(0, height, 0);
	let roofMesh = new THREE.Mesh(roofGeom, mat);

	result.add(roofMesh);
	
	return result;
}

function singleWall(base, height, mat) {
	let len = Geometry.dist(base.p1, base.p2);
	let geometry = new THREE.PlaneGeometry(len, height, 1);
	geometry.rotateY(-base.angle());
	geometry.translate((base.p1.x + base.p2.x)/2, height/2, (base.p1.y + base.p2.y)/2);

	return new THREE.Mesh(geometry, mat);
}

// Base should be segment
function segmentedWall(base, height, mat) {

	let len = Geometry.dist(base.p1, base.p2);

	let group = new THREE.Group();

	let segCount = Math.floor(height / params.hSegSize);
	let padding = height - segCount * params.hSegSize;

	for (let i = 0; i < segCount; i++) {
		let hSeg = hSegment(params.hSegSize, len, mat);

		hSeg.translateY(padding/2 + i * params.hSegSize);

		group.add(hSeg);
	}

	let bPadding = new THREE.Mesh(new THREE.PlaneGeometry(len, padding/2, 1), mat);
	let tPadding = bPadding.clone();

	bPadding.translateY(padding/4)
	tPadding.translateY(height-padding/4);

	group.add(bPadding);
	group.add(tPadding);

	group.rotateY(-base.angle());
	group.position.set((base.p1.x + base.p2.x)/2, 0, (base.p1.y + base.p2.y)/2);
	return group;
}

function hSegment(height, width, mat) {
	let group = new THREE.Group();

	let separator = hSeparator(height * 1/4, width, mat);
	let wall = hWall(height * 3/4, width, mat);

	separator.translateY(height * 1/8);
	wall.translateY(height * 3/8 + height * 1/4);

	group.add(separator);
	group.add(wall);

	return group;
}

function hSeparator(height, width, mat) {
	// let mat = new THREE.MeshLambertMaterial({color: 0x4287f5});

	let geometry = new THREE.BoxGeometry(width, height, 2);
	// let geometry = new THREE.PlaneGeometry(width, height, 1);
	return new THREE.Mesh(geometry, mat);
}

function hWall(height, width, mat) {

	let segCount = Math.floor(width / params.vSegSize);
	let padding = width - segCount * params.vSegSize;

	let group = new THREE.Group();

	for (let i = 0; i < segCount; i++) {
		let piece = wallPiece(height, params.vSegSize, mat);
		piece.translateX(-width/2 + padding/2 + params.vSegSize/2 + params.vSegSize * i);

		group.add(piece);
	}

	let lPadding = new THREE.Mesh(new THREE.PlaneGeometry(padding/2, height, 1), mat);
	let rPadding = lPadding.clone();

	lPadding.translateX(-width/2 + padding/4);
	rPadding.translateX(width/2 - padding/4);

	group.add(lPadding);
	group.add(rPadding);

	return group;
}

function wallPiece(height, width, mat) {
	let group = new THREE.Group();

	let wall = new THREE.Mesh(new THREE.PlaneGeometry(width, height, 1), mat);
	// let windowMesh = params.windowStyle.clone();

	// Make window naively
	let windowGeom = new THREE.BoxGeometry(width * 0.5, height * 0.5, 0.1);
	let windowMesh = new THREE.Mesh(windowGeom, windowMat);

	group.add(wall);
	group.add(windowMesh);

	return group;
}