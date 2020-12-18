// Numerical operations

Number.prototype.mod = function(n) {
		return ((this%n)+n)%n;
	}

// Point operations

export function Point(x, y) {
	this.x = x;
	this.y = y;
}

Point.prototype.copy = function() {
	return Object.assign(new Point([]), JSON.parse(JSON.stringify(this)));
}

export var dist = (p1, p2) => {
	return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

export var dot = (p1, p2) => {
	return p1.x * p2.x + p1.y * p2.y;
}

Point.prototype.add = function(p) {
	return new Point(this.x + p.x, this.y + p.y);
}

Point.prototype.sub = function(p) {
	return new Point(this.x - p.x, this.y - p.y);
}

Point.prototype.mult = function(f) {
	return new Point(f * this.x, f * this.y);
}

// Line segment operations

export function Segment(p1, p2) {
	this.p1 = p1;
	this.p2 = p2;
}

Segment.prototype.copy = function() {
	return new Segment(this.p1.copy(), this.p2.copy());
}

Segment.prototype.len = function() {
	return dist(this.p1, this.p2);
}

Segment.prototype.onSeg = function(p) {
	var error = 1 * Math.pow(10, -10);
	return dist(this.p1, p) + dist(this.p2, p)- dist(this.p1, this.p2) < error;
}

Segment.prototype.projectToSeg = function(p) {
	let l = this.len();
	let t = Math.max(0, Math.min(1, dot(p.sub(this.p1), this.p2.sub(this.p1)) / (l * l)));
	let projection = this.p1.add(this.p2.sub(this.p1).mult(t));
	return projection;
}

Segment.prototype.distToSeg = function(p) {
	let l = this.len();
	if (l == 0)
		return dist(p, this.p1);

	let proj = this.projectToSeg(p);
	return dist(p, proj);	
}

Segment.prototype.slope = function() {
	return (this.p2.y - this.p1.y) / (this.p2.x - this.p1.x);	// In js, div by 0 = Infinity
}

Segment.prototype.toLine = function() {
	return lineFromPoint(this.slope(), this.p1);
}

// Angle in rads
Segment.prototype.angle = function() {
	return Math.atan2(this.p2.y-this.p1.y, this.p2.x-this.p1.x);
}

// Line operations

export function Line(a, b, c) {
	this.a = a;
	this.b = b;
	this.c = c;
}

export var slopeInterceptLine = function(m, b) {
	return new Line(-m, 1, -b);
}

Line.prototype.solveY = function(x) {
	return -this.a/this.b * x - this.c/this.b;
}

Line.prototype.solveX = function(y) {
	return -this.b/this.a * y - this.c/this.a;
}

export var lineFromPoint = (m, p) => {
	if (m == Infinity || m == -Infinity)
		return new Line(1, 0, -p.x);
	else
		return slopeInterceptLine(m, p.y - m * p.x);
}

export var intersection = (l1, l2) => {
	// Horizontal, vertical, or parallel
	if ((l1.a == 0 && l2.a == 0) || (l1.b == 0 && l2.b == 0) || (l1.a == l2.a && l1.b == l2.b))
		return null;

	if (l1.a == 0) {
		let y = -l1.c / l1.b;
		return new Point(l2.solveX(y), y);
	} else if (l2.a == 0) {
		let y = -l2.c / l2.b;
		return new Point(l1.solveX(y), y);
	}
	if (l1.b == 0) {
		let x = -l1.c / l1.a;
		return new Point(x, l2.solveY(x));
	} else if (l2.b == 0) {
		let x = -l2.c / l2.a;
		return new Point(x, l1.solveY(x));
	} else {
		let x = (l1.c/l1.b-l2.c/l2.b)/(l2.a/l2.b-l1.a/l1.b);
		return new Point(x, l1.solveY(x));
	}
		
}

// Curve operations

export function Curve(p1, p2, p3) {
	this.p1 = p1;
	this.p2 = p2;
	this.p3 = p3;
}

// Operations

Curve.prototype.evalCurve = function(t) {
	t = Math.max(0, Math.min(1, t));
	return ((this.p1.mult(1-t)).add(this.p2.mult(t)).mult(1-t)).add((this.p2.mult(1-t)).add(this.p3.mult(t)).mult(t));
	// return add(mult(1 - t, add(mult(1-t, c.p1), mult(t, c.p2))), mult(t, add(mult(1-t, c.p2), mult(t, c.p3))));
}

// This is horrible, but will do for now
Curve.prototype.projectToCurve = function(p) {
	interval = 0.01;
	points = []
	for (let t = 0; t <= 1; t += interval) {
		points.push(this.evalCurve(t));
	}

	closest = points[0];
	for (const pt of points) {
		if (dist(p, pt) < dist(p, closest)) {
			closest = pt;
		}
	}
	
	return closest;
}

Curve.prototype.distToCurve = function(p) {
	let proj = this.projectToCurve(p);
	return dist(p, proj);
}

// Polygons

export function Polygon(points) {
	this.points = points;
	this.pointCount = points.length;
	this.edges = [];

	for (let i = 0; i < points.length; i++)
		this.edges.push(new Segment(points[i], points[(i+1)%points.length]));
}

Polygon.prototype.copy = function() {
	return new Polygon(this.points.map(p => p.copy()));
}

Polygon.prototype.computeEdges = function() {
	this.edges = [];
	for (let i = 0; i < this.points.length; i++)
		this.edges.push(new Segment(this.points[i], this.points[(i+1)%this.points.length]));
}

// Add vertex at position pos
Polygon.prototype.addVertex = function(point, pos) {
	this.points.splice(pos, 0, point);
	this.pointCount++;
	this.computeEdges();
}

// Works for concave polygons
Polygon.prototype.containsPoint = function(point) {
	let count = 0;

	for (let i = 0; i < this.points.length-1; i++) {
		let p1 = this.points[i];
		let p2 = this.points[i+1];

		if (p1 == point || p2 == point) 
			return true;

		if (p1.y >= point.y && p2.y <= point.y || 
			p1.y <= point.y && p2.y >= point.y) {
			let t = (point.y - p1.y) / (p2.y - p1.y);
			if (p1.x + (p2.x - p1.x) * t >= point.x)
				count++;
		}
	}

	return count % 2 == 1;
}

Polygon.prototype.containsPoly = function(inner) {
	for (var pt of inner.points)
		if (!this.containsPoint(pt))
			return false;

	return true;
}

// Returns [top, left, bottom, right] edges
Polygon.prototype.boundingBox = function() {
	let t = this.points[0].y;
	let b = this.points[0].y;
	let l = this.points[0].x;
	let r = this.points[0].x;

	for (let i = 1; i < this.points.length; i++) {
		let pt = this.points[i];
		t = Math.max(pt.y, t);
		l = Math.min(pt.x, l);
		b = Math.min(pt.y, b);
		r = Math.max(pt.x, r);
	}

	return {top: t, left: l, bottom: b, right: r};
}

Polygon.prototype.area = function() {
	let area = 0;
	let j = this.pointCount-1;

	for (var edge of this.edges) 
		area += (edge.p1.x + edge.p2.x) * (edge.p1.y - edge.p2.y);

	return Math.abs(area/2);
}

Polygon.prototype.split = function(line) {

	if (line.b == 0) {
		let temp = 0;
	}

	let workingPolygon = this.copy();

	let intersections = [];

	for (let i = 0; i < workingPolygon.edges.length; i++) {
		let edge = workingPolygon.edges[i];
		let pt = intersection(edge.toLine(), line);
		if (pt == null)
			continue;
		
		if (edge.onSeg(pt)) {
			workingPolygon.addVertex(pt, i+1);
			intersections.push(i+1);
			i++;
		}
	}

	if (intersections.length < 2)	// If no intersection or just grazes vertex, don't split 
		return [this.copy()];

	let first = intersections[0];
	let prev = intersections[intersections.length-1];
	let next = intersections[1];

	// To get second point, check whether line to previous or next intersection passes outside of block
	let second = this.containsPoint(workingPolygon.points[first].add(workingPolygon.points[prev]).mult(0.5)) ? prev : next;

	let poly1 = [];
	for (let v = first; v != second; v = (v+1).mod(workingPolygon.pointCount))
		poly1.push(workingPolygon.points[v]);
	poly1.push(workingPolygon.points[second]);

	let poly2 = [];
	for (let v = second; v != first; v = (v+1).mod(workingPolygon.pointCount))
		poly2.push(workingPolygon.points[v]);
	poly2.push(workingPolygon.points[first]);

	return [new Polygon(poly1), new Polygon(poly2)];
}

Polygon.prototype.center = function() {
	let bbox = this.boundingBox();
	let centerX = (bbox.right + bbox.left) / 2;
	let centerY = (bbox.top + bbox.bottom) / 2;

	return new Point(centerX, centerY);
}

Polygon.prototype.centered = function() {
	let bbox = this.boundingBox();
	let centerX = (bbox.right + bbox.left) / 2;
	let centerY = (bbox.top + bbox.bottom) / 2;

	let newPoints = this.points.map(p => new Point(p.x - centerX, p.y - centerY));

	let poly = new Polygon(newPoints);
	poly.computeEdges();

	return poly;
}

Polygon.prototype.orderCW = function() {
	let sum = 0;
	this.edges.map(e => { sum += (e.p2.x - e.p1.x) * (e.p2.y + e.p1.y); });
	if (sum < 0) {
		this.points = this.points.reverse();
		this.computeEdges();
	}
}

Polygon.prototype.adjust = function(amount) {
	this.orderCW();

	let center = this.center();

	let d = amount/2;	// Distance to shift edges
	let newEdges = [];

	for (let e = 0; e < this.edges.length; e++) {
		let edge = this.edges[e];
		let o = d / Math.sqrt(Math.pow(edge.p1.x - edge.p2.x, 2) + Math.pow(edge.p1.y - edge.p2.y, 2));
		let newPt = new Point(edge.p1.x - (edge.p2.y - edge.p1.y)*o, edge.p1.y + (edge.p2.x - edge.p1.x) * o);

		/* if (Geometry.dist(newPt, center) > Geometry.dist(edge.p1, center)) {
			newPt = new Point(edge.p1.x + (edge.p2.y - edge.p1.y)*o, edge.p1.y - (edge.p2.x - edge.p1.x) * o);
		} */
		newEdges.push(lineFromPoint(edge.slope(), newPt));	
	}

	return polygonFromEdges(newEdges);
}


export var polygonFromEdges = (edges) => {
	let points = [];
	for (let e = 0; e < edges.length; e++) {
		let pt = intersection(edges[e], edges[(e+1) % edges.length]);
		if (pt == null)
			return null;
		points.push(pt);
	}
	return new Polygon(points);
}

