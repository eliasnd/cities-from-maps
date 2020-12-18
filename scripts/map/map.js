import { Point, Segment, Curve, dist } from "../geometry.js";
import { drawTo, drawCircle, drawLine, drawCurve } from "./drawing.js";

var canvas;
var ctx;

var usingCurve = false;

export function toggleCurve(val) {
	usingCurve = val;
}

export function init(cvs, cx) {
    canvas = cvs;
    ctx = cx;
    drawTo(ctx);
}

var map = {
    filetype: "map",
    vertices: [],
    edges: []
}

var addEdge = (p1, p2) => {
    map.edges[p1].push(p2);
    map.edges[p2].push(p1);
}

var removeEdge = (p1, p2) => {
    map.edges[p1].splice(map.edges[p1].indexOf(p2), 1);
    map.edges[p2].splice(map.edges[p2].indexOf(p1), 1);
}

/* map = {
    filetype: "map",
	points: [],
	lines: [],
	curves: []
} */

var startPointIndex = -1;
var marginOfError = 10;

var curvePoint = null;    // For bezier curves

export function click(x, y, shift) {

    let pt = new Point(x, y);

    if (shift && startPointIndex != -1) {
        let startPoint = map.vertices[startPointIndex];
        if (usingCurve) {
            if (curvePoint == null) {
                if (Math.abs(pt.x - startPoint.x) < Math.abs(pt.y - startPoint.y))
                    pt = new Point(startPoint.x, pt.y);
                else
                    pt = new Point(pt.x, startPoint.y);
            } else {
                if (Math.abs(pt.x - curvePoint.x) < Math.abs(pt.y - curvePoint.y))
                    pt = new Point(curvePoint.x, pt.y);
                else
                    pt = new Point(pt.x, curvePoint.y);
            }
        } else {
            if (Math.abs(pt.x - startPoint.x) < Math.abs(pt.y - startPoint.y))
                pt = new Point(startPoint.x, pt.y);
            else
                pt = new Point(pt.x, startPoint.y);
        }
    }
    
    // Check if clicked on existing point

    var pIndex;    // Calculate index of point

    for (pIndex = 0; pIndex < map.vertices.length; pIndex++) {
        if (dist(pt, map.vertices[pIndex]) < marginOfError) {
            pt = map.vertices[pIndex];    // If clicked existing point, set index and stop
            console.log("existing");
            break;
        }
    }

    if (pIndex == map.vertices.length && !(usingCurve && startPointIndex != -1 && curvePoint == null)) {

        map.edges.push([]);

        let projected = false;

        for (let i = 0; i < map.vertices.length && !projected; i++)
            for (let e = 0; e < map.edges[i].length && !projected; e++) {
                let seg = new Segment(map.vertices[i], map.vertices[map.edges[i][e]]);
                if (seg.distToSeg(pt) < marginOfError) {
                    projected = true;
                    pt = seg.projectToSeg(pt);
                    
                    addEdge(pIndex, i);
                    addEdge(pIndex, map.edges[i][e]);
                    removeEdge(i, map.edges[i][e]);
                }
            }

        map.vertices.push(pt);
    }


    if (startPointIndex == -1) {
    	drawCircle(pt, 5, "red");
    	startPointIndex = pIndex;
    } else {
        var startPoint = map.vertices[startPointIndex];

        if (usingCurve) {
            if (curvePoint == null) {

                drawCircle(pt, 5, "blue");
                curvePoint = pt;
            } else {

                drawCircle(startPoint, 5, "black");
                drawCircle(curvePoint, 6, "white");
                drawCircle(pt, 5, "black");
                drawCurve(startPoint, curvePoint, pt, 3);

                addCurve(new Curve(startPoint, curvePoint, pt), startPointIndex, pIndex, 0.1);
                // map.points.push(pt); // here
                startPointIndex = -1;
                curvePoint = null;
            }

        } else {

            drawCircle(startPoint, 5, "black");

            if (startPoint == pt)
                return;

            drawCircle(pt, 5, "black");
            drawLine(startPoint, pt, 3);

            addEdge(pIndex, startPointIndex);
            startPointIndex = -1;
        }	
    }

    // TODO: Add intersections wherever new lines cross
}

// Add curve to graph, using start and end indices
var addCurve = (c, sIndex, eIndex, interval) => {
    var curveStartIndex = map.vertices.length;
    var pointCount = Math.floor(1 / interval) - 2;

    for (let i = 1; i <= pointCount; i++) {
        let t = i * interval;
        map.vertices.push(c.evalCurve(t));
        map.edges.push([]);
    }

    addEdge(sIndex, curveStartIndex);

    var i;

    for (i = curveStartIndex; i < curveStartIndex + pointCount - 1; i++) {
        addEdge(i, i+1);
    }

    addEdge(curveStartIndex + pointCount - 1, eIndex);
}

function download(filename, text) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

export function saveMap() {
    console.log(map);
    download("map.json", JSON.stringify(map));

}