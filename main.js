"use strict";

function Rng(a) {
	// source: https://stackoverflow.com/a/47593316
	return function() {
		var t = a += 0x6D2B79F5;
		t = Math.imul(t ^ t >>> 15, t | 1);
		t ^= t + Math.imul(t ^ t >>> 7, t | 61);
		return ((t ^ t >>> 14) >>> 0) / 4294967296;
	}
}

class Range{
	constructor(min, max) {
		if (max >= min){
			this.min = min;
			this.max = max;
		} else {
			this.min = max;
			this.max = min;
		}
	}

	sample(t) {
		return t * (this.max - this.min) + this.min;
	}
}

function sample_range(min, max, t){
	return new Range(min, max).sample(t)
}

function lerp(a, b, t) {
	let c = {};
	for (let prop in a) {
		c[prop] = a[prop] * (1 - t) + b[prop] * t;
	}
	return c;
}

function quadBezier(p0, p1, p2, t) {
	let q0 = lerp(p0, p1, t);
	let q1 = lerp(p1, p2, t);
	return lerp(q0, q1, t);
}

function clamp(v, lower, upper) {
	return Math.min(upper, Math.max(v, lower));
}

class HslColor {

	static hexmatcher = /^\#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;

	constructor(hsl, alpha) {
		if (alpha === undefined) {
			alpha = 1;
		}
		this.alpha = alpha;
		this.hsl = hsl;
	}

	static fromRgbHex(hex, alpha){
		let match = this.hexmatcher.exec(hex);
		let r = parseInt(match[1], 16);
		let g = parseInt(match[2], 16);
		let b = parseInt(match[3], 16);
		let hsl = rgbToHsl(r, g, b);
		return new HslColor(hsl, alpha);
	}

	modify(hdiff, sdiff, ldiff){
		let hue = this.hsl[0] + hdiff;
		hue -= Math.floor(hue);
		return new HslColor([
			hue,
			clamp(this.hsl[1] + sdiff, 0, 1),
			clamp(this.hsl[2] + ldiff, 0, 1)
		], this.alpha);
	}

	toString(){
		let [h, s, l] = this.hsl;
		return `hsl(${h}turn ${s*100}% ${l*100}% / ${this.alpha})`;
	}
}



function control(id) {
	return Number(document.getElementById(id).value);
}

function redraw() {
	let seed = control("seed");
	let width = control("width");
	let height = control("height");
	let nblades = control("nblades");
	let nsegments = control("nsegments");
	let bladeWidth = new Range(control("bladewidthmin"), control("bladewidthmax"));
	let spread = control("spread");
	let clearedge = control("clearedge");
	let huespread = control("huespread");
	let saturationspread = control("saturationspread");
	let lightnessspread = control("lightnessspread");
	let baseColorHex = document.getElementById("basecolor").value;
	let baseColor = HslColor.fromRgbHex(baseColorHex, control("coloralpha"));

	let random = Rng(seed);
	let canvas = document.getElementById("canvas");
	canvas.width = width;
	canvas.height = height;
	let ctx = canvas.getContext("2d");

	for (let i = 0; i < nblades; ++i){
		let base = {
			x: sample_range(clearedge, 1-clearedge, random()) * width,
			y: 0,
			w: bladeWidth.sample(random())
		};
		let end = {
			x: sample_range(Math.max(base.x - spread, 0), Math.min(base.x + spread, width), random()),
			y: sample_range(height / 2, height, random()),
			w: 0//base.w / 2
		};
		let control = {
			x: sample_range(Math.max(base.x - spread, 0), Math.min(base.x + spread, width), random()),
			y: sample_range(end.y / 2, end.y, random()),
			w: sample_range(base.w/2, base.w, random())
		}
		let color = baseColor.modify(
			sample_range(-huespread, huespread, random()),
			sample_range(-saturationspread, saturationspread, random()),
			sample_range(-lightnessspread, lightnessspread, random())
		);
		ctx.fillStyle = color.toString();
		ctx.beginPath();
		ctx.moveTo(base.x - base.w, height - base.y);
		for (let p = 1; p < nsegments * 2 + 1; ++p) {
			let t = Math.min(p, 2 * nsegments - p) / nsegments;
			let b = (p > nsegments) * 2 - 1;
			let pos = quadBezier(base, control, end, t);
			ctx.lineTo(pos.x + pos.w * b, height - pos.y);
		}
		ctx.fill();
	}
}

function main(){
	for (let node of document.getElementsByTagName("input")){
		node.addEventListener("input", redraw);
	}
	redraw();
}

addEventListener("load", main)
