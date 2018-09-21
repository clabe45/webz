import {flush, fragment, project, toCanvas} from './core.js';
import {line, triangle, interpolateLinear} from './util.js';

/**
 * A representation of a list of vertices
 * Renders in triangles
 */
export class Model {
	constructor(world, color/*, transform*/) {
        // TODO: implement transformation matrix
		this.world = world;
        this.screen = this.canvas = null;	// wait until render to calc these
        this.color = color;
		// this.transform = transform || {screen: null, world: null, model: null};
	}

    renderPoints() {
		this.screen = this.screen || this.world.map(world => project(world));
        this.canvas = this.canvas || this.screen.map(screen => toCanvas(screen));
		// TODO: remove duplicates
    	for (let i=0; i<this.world.length; i++)
    		this.renderVertexPoint(i);
        flush();
    }
    renderVertexPoint(i) {
    	let canv = this.canvas[i], clr = this.color[i];
    	fragment(canv.x, canv.y, canv.z, canv.w, clr.r, clr.g, clr.b, clr.a);
    }

    renderLines() {
		this.screen = this.screen || this.world.map(world => project(world));
		this.canvas = this.canvas || this.screen.map(screen => toCanvas(screen));

    	for (let i=0; i<this.world.length; i+=3) {
        	this.renderTriangleLines(i);
        }
        flush();
    }
    renderTriangleLines(iStart) {
        for (let i=1; i<3; i++)
            this.renderVertexLine(iStart+i-1, iStart+i);
        this.renderVertexLine(iStart+2, iStart+0); // close "path"
    }
    renderVertexLine(iFrom, iTo) {
    	line(
            this.canvas[iFrom].x, this.canvas[iFrom].y,
            this.canvas[iTo].x, this.canvas[iTo].y,
            (x, y) => {
				// TODO: maybe average x progress with y progress => t
				let t = (x - this.canvas[iFrom].x) / (this.canvas[iTo].x - this.canvas[iFrom].x);
				t = t|| (y - this.canvas[iFrom].y) / (this.canvas[iTo].y - this.canvas[iFrom].y);
				let clrFrom = this.color[iFrom], clrTo = this.color[iTo];
                fragment(
					// `fragment` expects the world z to be in w (can change if need to)
					x, y, null, interpolateLinear(this.world[iFrom].z, this.world[iTo].z, t),
					interpolateLinear(clrFrom.r, clrTo.r, t),
						interpolateLinear(clrFrom.g, clrTo.g, t),
						interpolateLinear(clrFrom.b, clrTo.b, t),
						interpolateLinear(clrFrom.a, clrTo.a, t)
				);
            }
        );
    }

	render() {
		this.screen = this.screen || this.world.map(world => project(world));
		this.canvas = this.canvas || this.screen.map(screen => toCanvas(screen));

		for (let i=0; i<this.world.length; i+=3) {
        	this.renderTriangle(i);
        }
        flush();
	}
	renderTriangle(iStart) {
		let [v1, v2, v3] = this.canvas.slice(iStart, iStart+3);
		let [c1, c2, c3] = this.color.slice(iStart, iStart+3);

		triangle(v1.x, v1.y, v2.x, v2.y, v3.x, v3.y, (x, y) => {
			// interpolate in triangle using barycentric coordinates
			let w1 = ((v2.y-v3.y)*(x-v3.x) + (v3.x-v2.x)*(y-v3.y))
				/ ((v2.y-v3.y)*(v1.x-v3.x) + (v3.x-v2.x)*(v1.y-v3.y));
			let w2 = ((v3.y-v1.y)*(x-v3.x) + (v1.x-v3.x)*(y-v3.y))
				/ ((v2.y-v3.y)*(v1.x-v3.x) + (v3.x-v2.x)*(v1.y-v3.y));
			let w3 = 1 - w1 - w2;

			fragment(
				// `fragment` expects the world z to be in w (can change if need to)
				x, y, null, w1*v1.w + w2*v2.w + w3*v3.w,
				w1*c1.r + w2*c2.r + w3*c2.r,
					w1*c1.g + w2*c2.g + w3*c2.g,
					w1*c1.b + w2*c2.b + w3*c2.b,
					w1*c1.a + w2*c2.a + w3*c2.a
			);
		});
	}
}

/** creates a flat quadraliteral */
export function quad(v1, v2, v3, v4, c1, c2, c3, c4) {
	return new Model([
		// triangle 1
		v1, v2, v3,
		// triangle 2
		v1, v3, v4	// is that correct??
	], (c1 && c2 && c3 && c4) ? [
		c1, c2, c3,
		c1, c3, c4
	] : undefined);
}

/**
 * Creates a rectangular solid
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @param {number} width - can be negative
 * @param {number} height - can be negative
 * @param {number} depth - can be negative
 * @param {object|array} [color] - a solid color or an array of 8 colors as follows:
 // * <ol>
 // *   <li><code>(x, y, z)</code></li>
 // *   <li><code>(x+width, y, z)</code></li>
 // *   <li><code>(x, y+height, z)</code></li>
 // *   <li><code>(x+width, y+height, z)</code></li>
 // *   <li><code>(x, y, z+depth)</code></li>
 // *   <li><code>(x+width, y, z+depth)</code></li>
 // *   <li><code>(x, y+height, z+depth)</code></li>
 // *   <li><code>(x+width, y+height, z+depth)</code></li>
 // * </ol>
 * <ol>
 *   <li><code>left</code></li>
 *   <li><code>right</code></li>
 *   <li><code>bottom</code></li>
 *   <li><code>top</code></li>
 *   <li><code>front</code></li>
 *   <li><code>back</code></li>
 * </ol>
 */
export function rect(x, y, z, width, height, depth, color=undefined) {
	let vertices = [], colors = [];
    // front and back
    [0, depth].forEach((zoff, i) => {
		let a = Array.isArray(color);
        let qu = quad(
            {x: x, y: y, z: z+zoff},
            {x: x+width, y: y, z: z+zoff},
            {x: x+width, y: y+height, z: z+zoff},
            {x: x, y: y+height, z: z+zoff},
			// color[0+4*i], color[1+4*i], color[2+4*i], color[3+4*i]	// i is 0 or 1
			color[0+i], color[0+i], color[0+i], color[0+i]
        );
		vertices = vertices.concat(qu.world);
		if (Array.isArray(color)) colors = colors.concat(qu.color);
    });
    // top and bottom
	[0, height].forEach((yoff, i) => {
        let qu = quad(
            {x: x, y: y+yoff, z: z},
            {x: x+width, y: y+yoff, z: z},
            {x: x+width, y: y+yoff, z: z+depth},
            {x: x, y: y+yoff, z: z+depth},
			// color[0+2*i], color[1+2*i], color[5+2*i], color[4+2*i]	// i is 0 or 1
			color[2+i], color[2+i], color[2+i], color[2+i]
        );
		vertices = vertices.concat(qu.world);
		if (Array.isArray(color)) colors = colors.concat(qu.color);
    });
    // left and right
    [0, width].forEach((xoff, i) => {
        let qu = quad(
        	{x: x+xoff, y: y, z: z},
            {x: x+xoff, y: y+height, z: z},
            {x: x+xoff, y: y+height, z: z+depth},
            {x: x+xoff, y: y, z: z+depth},
			// color[0+i], color[2+i], color[6+i], color[4+i]	// i is 0 or 1
			color[4+i], color[4+i], color[4+i], color[4+i]
        );
		vertices = vertices.concat(qu.world);
		if (Array.isArray(color)) colors = colors.concat(qu.color);
    });
	if (typeof color === 'object' && !Array.isArray(color)) colors = new Array(vertices.length).fill(color);
	return new Model(vertices, colors);
}
