import { init, toggleCurve, click, saveMap } from "./map.js";

var size = Math.min(window.innerWidth, window.innerHeight) * 0.7;

var canvas = document.getElementById("canvas");

canvas.width = size;
canvas.height = size;

var handleClick = (e) => {
	let rect = canvas.getBoundingClientRect(); 
    let x = event.clientX - rect.left; 
    let y = event.clientY - rect.top;

    click(x, y, e.shiftKey);
}

canvas.addEventListener("mousedown", handleClick);
document.getElementById("line-button").addEventListener("click", () => toggleCurve(false));
document.getElementById("curve-button").addEventListener("click", () => toggleCurve(true));
document.getElementById("save-button").addEventListener("click", saveMap);

init(canvas, canvas.getContext("2d"));