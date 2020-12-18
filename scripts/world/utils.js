import * as THREE from "/node_modules/three/build/three.module.js";
import { BufferGeometryUtils } from "/node_modules/three/examples/jsm/utils/BufferGeometryUtils.js";

export function polyToShape(poly) {
	var shape = new THREE.Shape();

	shape.moveTo(poly.points[0].x, poly.points[0].y);

	for (var point of poly.points)
		shape.lineTo(point.x, point.y);

	shape.lineTo(poly.points[0].x, poly.points[0].y);

	return shape;
}

export var extrudePoly = (poly, height) => {
	let result = new THREE.ExtrudeGeometry(polyToShape(poly), { depth: height, bevelEnabled: false });
	result.rotateX(Math.PI / 2).translate(0, height, 0);
	return result;
}

export var randRange = (min, max) => { return Math.random() * (max - min) + min; }

export var mergeGeometries = (mesh1, mesh2) => {

	let bg1 = new THREE.BufferGeometry().fromGeometry(mesh1.geometry);
	let bg2 = new THREE.BufferGeometry().fromGeometry(mesh2.geometry);

	let result = new THREE.Geometry();
	result.merge(mesh1.geometry, mesh1.matrix);
	result.merge(mesh2.geometry, mesh2.matrix);

	return result;
}

// Creates subtracted inner polygon as we want
export function depressedPoly(poly, height, depressionHeight) {
	let geometry = new THREE.Geometry();

	let n = poly.pointCount;

	let basePoint = (i) => 4*i;
	let topPoint = (i) => 4*i + 1;
	let innerPoint = (i) => 4*i + 2;
	let depressedPoint = (i) => 4*i + 3;

	for (let pt of poly.points) {
		geometry.vertices.push(
			new THREE.Vector3(pt.x, 0, pt.y),
			new THREE.Vector3(pt.x, height, pt.y),
			new THREE.Vector3(pt.x * 0.8, height, pt.y * 0.8),
			new THREE.Vector3(pt.x * 0.8, height - depressionHeight, pt.y * 0.8)
		);
	}

	for (let i = 0; i < n; i++) {
		geometry.faces.push(new THREE.Face3(basePoint(i), basePoint((i+1)%n), topPoint(i)));
		geometry.faces.push(new THREE.Face3(topPoint(i), topPoint((i+1)%n), basePoint((i+1)%n)));

		// geometry.faces.push(new THREE.Face3(topPoint(i), topPoint((i+1)%n), innerPoint(i)));
		// geometry.faces.push(new THREE.Face3(innerPoint(i), innerPoint((i+1)%n), topPoint((i+1)%n)));

		// geometry.faces.push(new THREE.Face3(innerPoint(i), depressedPoint(i), depressedPoint((i+1)%n)));
		// geometry.faces.push(new THREE.Face3(innerPoint(i), depressedPoint((i+1)%n), innerPoint((i+1)%n)));
	}

	for (let i = 1; i < n-1; i++) {
		// geometry.faces.push(new THREE.Face3(depressedPoint(0), depressedPoint(i), depressedPoint((i+1)%n)));
		geometry.faces.push(new THREE.Face3(topPoint(0), topPoint(i), topPoint(i+1)));
	}

	console.log(geometry);

	return geometry;
}