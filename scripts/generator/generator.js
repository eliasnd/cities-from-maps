import {loadMap} from "../world/scene.js";
import { Point, Segment, Polygon, lineFromPoint, polygonFromEdges } from "../geometry.js";
import * as Geometry from "../geometry.js";

let maxPlotSize;
let roadWidth = 15;

export function handleSubmit() {
	let upload = document.getElementById("map-file").files;
	maxPlotSize = document.getElementById("lot-size").value;

	document.getElementById("form-container").hidden = true;

	if (maxPlotSize <= 0) {
		console.error("max plot size must be greater than 0");
		return;
	}

	if (upload.length == 0)
		console.error("Must provide a map file");
	else {
		var reader = new FileReader();
	    reader.onload = function(event) {
	        generate(decodeMap(JSON.parse(event.target.result)));
	    };
	    reader.readAsText(upload[0]);
	}
}

function decodeMap(obj) {
	return {
		...obj,
		vertices: obj.vertices.map(p => new Point(p.x, p.y))		
	}
}

var drawLine = (p1, p2, thickness, ctx) => {
    // console.log("line");
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineWidth = thickness;
    ctx.stroke();
}

function generate(mapObj) {
	if (!mapObj["filetype"] || mapObj["filetype"] != "map")
		console.error("File must be a map");

	let blocks = getBlocks(mapObj);

	// Center blocks

	let bbox = blocks[0].boundingBox();

	for (let block of blocks) {
		let block_bbox = block.boundingBox();
		bbox.left = Math.min(bbox.left, block_bbox.left);
		bbox.right = Math.max(bbox.right, block_bbox.right);
		bbox.top = Math.max(bbox.top, block_bbox.top);
		bbox.bottom = Math.min(bbox.bottom, block_bbox.bottom);
	}

	let center = new Point((bbox.left + bbox.right)/2, (bbox.bottom + bbox.top)/2);

	for (let block of blocks) {
		block.points = block.points.map(pt => new Point(pt.x - center.x, pt.y - center.y));
		block.computeEdges();
	}

	// Adjust for roads

	blocks = blocks.map(block => adjustPlot(block));

	let plots = [];

	let p = Math.round(Math.random());
	for (const block of blocks) {
		plots = plots.concat(partitionBlock(block, p));	// Each block gets list of plots in plot array
		p = (p+1) % 2;
	}

	drawMap(blocks, plots);

	plots = plots.map(p => {
		let bbox = p.boundingBox();
		return {
			pos: new Point((bbox.left + bbox.right) / 2, (bbox.top + bbox.bottom) / 2),
			poly: p.centered()
		};
	});

	blocks = blocks.map(b => {
		let bbox = b.boundingBox();
		return {
			pos: new Point((bbox.left + bbox.right) / 2, (bbox.top + bbox.bottom) / 2),
			poly: b.centered()
		};
	});
	

	loadMap({map: mapObj, blocks: blocks, plots: plots});
}

// Returns all enclosed "blocks" in map as polygon objects
// 2 steps: extract cycles, then get only smallest independent cycles as polygons (refinement)
function getBlocks(map) {

	// CYCLE EXTRACTION BEGINS HERE

	let cycles = [];

	let explore = (v, p, explored, prev) => {

		if (explored[v] == 2)
			return;
		else if (explored[v] == 1) {
			let cycle = [v]
			let c = p;
			while (c != v) {
				cycle.push(c);
				c = prev[c];
			}

			cycles.push(cycle);
			return;
		}

		explored[v] = 1;

		prev[v] = p;
		for (const neighbor of map.edges[v]) {
			if (neighbor == p)
				continue;

			explore(neighbor, v, explored.slice(0), prev.slice(0));
		}

		explored[v] = 2;
	}

	let E = [];
	let P = [];

	for (const v of map.vertices) {
		E.push(0);
		P.push(-1);
	}

	for (let v = 0; v < map.vertices.length; v++) {
		if (E[v] == 0)
			explore(v, -1, E, P);
	}

	// REFINEMENT BEGINS HERE

	// Picks single cycle if in conflict
	// 0 = first cycle, 1 = second cycle, -1 = no conflict
	let selectCycle = (c1, c2) => {
		let s1 = new Set(c1);
		let s2 = new Set(c2);

		if (c1.size == c2.size) {
			for (var el of s1)
				if (!s2.has(el))
					return -1;
			return 0;
		} else if (c1.size > c2.size) {
			for (var el of s2)
				if (!(s1).has(el))
					return -1;
			return 1;
		} else {
			for (var el of s1)
				if (!s2.has(el))
					return -1;
			return 0;
		}
	}

	for (let i = 0; i < cycles.length; i++) {
		let removed = false;
		for (let j = i+1; j < cycles.length; j++) {
			let cycle = selectCycle(cycles[i], cycles[j]);
			if (cycle == 0) {
				cycles.splice(j, 1);
				j--;
			} else if (cycle == 1) {
				cycles.splice(i, 1);
				removed = true;
				break;
			}
		}
		if (removed)
			i--;
	}

	let blocks = [];
	for (let i = 0; i < cycles.length; i++)
		blocks.push(new Polygon(cycles[i].map(e => map.vertices[e])));

	for (let i = 0; i < blocks.length; i++) {
		let removed = false;
		for (let j = i+1; j < blocks.length; j++)
			if (blocks[i].containsPoly(blocks[j])) {
				blocks.splice(i, 1);
				removed = true;
				break;
			} else if (blocks[j].containsPoly(blocks[i])) {
				blocks.splice(j, 1);
				j--;
			}
		if (removed)
			i--;
	}

	return blocks;
}

// Splits block in two along parity, then does recursion
// May not work if split line perfectly intersects vertex, but extremely unlikely (I hope)
function partitionBlock(block, parity) {

	if (block.area() <= maxPlotSize)
		return [block];

	let bbox = block.boundingBox();
	let offset = Math.pow(Math.random() - 0.5, 3) + 0.5;	// Maps [0,1] => [0.4473, 0.5527] cubically
	let splitLine;	// Line representing split

	let minSlope = new Segment(block.points[0], block.points[1]).slope();
	let maxSlope = new Segment(block.points[0], block.points[1]).slope();
	for (let i = 1; i < block.points.length; i++) {
		let m = new Segment(block.points[i], block.points[(i+1)%block.points.length]).slope();
		if (Math.abs(m) < Math.abs(minSlope))
			minSlope = m;
		if (Math.abs(m) > Math.abs(maxSlope))
				maxSlope = m;
	}

	if (parity == 0) {
		let splitPoint = new Point((bbox.left + bbox.right) / 2, bbox.bottom + (bbox.top - bbox.bottom) * offset);	// Interpolate by offset

		let m = Math.abs(minSlope) < 0.4 ? minSlope : Math.abs(-1/maxSlope) < 0.4 ? -1/maxSlope : 0;
		// let m = Math.abs(minSlope) > 0.3 ? (Math.random() - 0.5) : minSlope + (Math.random() - 0.5);
		splitLine = lineFromPoint(m, splitPoint);

	} else {
		let splitPoint = new Point(bbox.left + (bbox.right - bbox.left) * offset, (bbox.bottom + bbox.top) / 2);

		let m = Math.abs(maxSlope) > 0.8 ? maxSlope : Math.abs(-1/minSlope) > 0.7 ? -1/minSlope : Infinity;
		// let m = Math.abs(maxSlope) < 8 ? (Math.random() - 0.5) * 2 * (Math.random() * 50 + 30) : maxSlope + (Math.random() * 10 - 5);
		splitLine = lineFromPoint(m, splitPoint);
	}

	let result = [];

	let blocks = block.split(splitLine);

	for (var b of blocks) 
		result = result.concat(partitionBlock(b, (parity+1)%2));

	return result;
}

// Return array of hash tables associating edges with roads
// O(b * n * p * n) for now
function markRoads(plots, blocks) {
	let roads = [];
	blocks.map(block => { roads = roads.concat(block.edges); } );
	roads = new Set(roads);

	let markedArray = [];

	for (let plot of plots) {
		let marked = [];

		for (let edge of plot.edges) {
			let onRoad = false;
			for (let road of roads) {
				if (road.onSeg(edge.p1) && road.onSeg(edge.p2)) {
					onRoad = true;
					continue;
				}
			}
			marked.push(onRoad);
		}
		markedArray.push(marked);
	}

	return markedArray;
}

// Push back block from road
function adjustPlot(plot) {

	plot.orderCW();

	let center = plot.center();

	let d = roadWidth/2;	// Distance to shift edges
	let newEdges = [];

	for (let e = 0; e < plot.edges.length; e++) {
		let edge = plot.edges[e];
		let o = d / Math.sqrt(Math.pow(edge.p1.x - edge.p2.x, 2) + Math.pow(edge.p1.y - edge.p2.y, 2));
		let newPt = new Point(edge.p1.x + (edge.p2.y - edge.p1.y)*o, edge.p1.y - (edge.p2.x - edge.p1.x) * o);

		/* if (Geometry.dist(newPt, center) > Geometry.dist(edge.p1, center)) {
			newPt = new Point(edge.p1.x + (edge.p2.y - edge.p1.y)*o, edge.p1.y - (edge.p2.x - edge.p1.x) * o);
		} */
		newEdges.push(lineFromPoint(edge.slope(), newPt));	
	}

	return polygonFromEdges(newEdges);
}

function drawMap(blocks, plots) {
	var canvas = document.getElementById("map");
	var ctx = canvas.getContext("2d");

	ctx.fillStyle = "#ebebeb";
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	ctx.strokeStyle="#333333";
	ctx.lineWidth = "10";
	ctx.beginPath();
	ctx.rect(0, 0, canvas.width, canvas.height);
	ctx.stroke();

	let bbox = blocks[0].boundingBox();

	for (let block of blocks) {
		let block_bbox = block.boundingBox();
		bbox.left = Math.min(bbox.left, block_bbox.left);
		bbox.right = Math.max(bbox.right, block_bbox.right);
		bbox.top = Math.max(bbox.top, block_bbox.top);
		bbox.bottom = Math.min(bbox.bottom, block_bbox.bottom);
	}

	let mapSize = Math.max(bbox.right - bbox.left, bbox.top - bbox.bottom) + 40;
	let canvasSize = Math.min(canvas.width, canvas.height);

	let conversion = canvasSize / mapSize;

	ctx.strokeStyle="#4a4a4a";

	for (var block of blocks)
		for (var edge of block.edges) {
			let p1_norm = new Point(edge.p1.x * conversion + canvas.width/2, edge.p1.y * conversion + canvas.height/2);
			let p2_norm = new Point(edge.p2.x * conversion + canvas.width/2, edge.p2.y * conversion + canvas.height/2);
			drawLine(p1_norm, p2_norm, 4, ctx);
		}

	ctx.strokeStyle = "#8c8c8c"

	for (var plot of plots)
		for (var edge of plot.edges) {
			let p1_norm = new Point(edge.p1.x * conversion + canvas.width/2, edge.p1.y * conversion + canvas.height/2);
			let p2_norm = new Point(edge.p2.x * conversion + canvas.width/2, edge.p2.y * conversion + canvas.height/2);
			drawLine(p1_norm, p2_norm, 1, ctx);
		}
}
