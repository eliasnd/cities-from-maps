import * as THREE from "/node_modules/three/build/three.module.js";

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

export var mergeGeometries = (geom1, geom2) => {
	let mesh1 = new THREE.Mesh(geom1);
	mesh1.updateMatrix();

	let mesh2 = new THREE.Mesh(geom2);
	mesh2.updateMatrix();

	let result = new THREE.Geometry();
	result.merge(mesh1.geometry, mesh1.matrix);
	result.merge(mesh2.geometry, mesh2.matrix);

	return result;
}