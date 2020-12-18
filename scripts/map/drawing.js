var ctx;

export function drawTo(context) {
    ctx = context;
}

export function drawCircle(p, size, color) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, size, 0, 2 * Math.PI, false);
    ctx.fillStyle = color;
    ctx.fill();
}

export function drawLine(p1, p2, thickness) {
    // console.log("line");
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineWidth = thickness;
    ctx.stroke();
}

export function drawCurve(p1, p2, p3, thickness) {
	ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.quadraticCurveTo(p2.x, p2.y, p3.x, p3.y);
    ctx.lineWidth = thickness;
    ctx.stroke();
}