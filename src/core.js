let canvas, ctx, currImageData;
let depthMap;   // just an array of a z value for each pixel on the canvas

window.addEventListener('load', () => {
    canvas = document.getElementById('render');
    ctx = canvas.getContext('2d');
    currImageData = null;

    depthMap = new Array(canvas.width * canvas.height);

    ASPECT_RATIO = canvas.width / canvas.height;

    clear();
});

let ASPECT_RATIO=null,
	FOV=Math.PI/6,
    NEAR=0.5, FAR=20,
    DIST_CAM_PLANE=1/Math.tan(FOV/2);

/**
 * Modifies a single pixel's color and depth
 * @param {object} loc - the pixel's location on the canvas with its <em>z</em>-component stored in <code>w</code>
 * @param {object} col
 */
export function fragment(x, y, z, w, r, g, b, a) {
    x = Math.floor(x);
    y = Math.floor(y);
    // clip (ik it's a weird way of doing it, because x and y aren't normalized; can change this later on)
    let depth = (1/-w - 1/NEAR) / (1/FAR - 1/NEAR);  // normalize depth
    // if (Math.random() > 0.75) console.log(x, y, w);
    // console.log('frag', x, y, z, w, depth);
    if (!(x >= 0 && x < canvas.width && y >= 0 && y < canvas.height && depth >= 0 && depth <= 1)) return;   // works for NaN too
    // console.log('  passed clipping');

    let iDepth = y * canvas.width + x;
    // use depth test function: < so the opposite of >=
    if (depthMap[iDepth] > 0 && depthMap[iDepth] <= depth) return;   // depth test failed
    // console.log('  passed depth test');
    // depth test passed

    // update depth
    depthMap[iDepth] = depth;

    let iCanvas = 4 * (y * canvas.width + x); // applies to both canvases (it should at least)
    // paint pixel onto imagedata
    currImageData = currImageData || ctx.getImageData(0, 0, canvas.width, canvas.height);
    [r, g, b, a].forEach((c, ci) => {
        currImageData.data[iCanvas+ci] = c * 255;
    });
}
/** Puts the modified fragments to the canvas; only for render component */
export function flush() {
    if (!currImageData) return; // nothing to flush
    ctx.putImageData(currImageData, 0, 0);
    currImageData = null;
}

/** Clears the color and depth data at once */
export function clear() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    depthMap.fill(0);
}
export function project(world) {
	const d = DIST_CAM_PLANE, ar = ASPECT_RATIO;
    let screen = {};
    // ogldev.atspace.co.uk/www/tutorial12/tutorial12.html
    // perspective projection
    screen.w = world.z;
    // map z from [NEAR, FAR] to [-1, +1], after stored in w
    screen.z = 2 * (world.z - FAR) / (FAR - NEAR) + 1;
    // one step is mapping x from [-ar, +ar] to [-1, +1]
    screen.x = d / ar * world.x / -screen.w;
    screen.y = d * world.y / -screen.w;
    /* screen.z = d;	// is that ok???? */

    return screen;
}

export function toCanvas(screen) {
	return {
    	x: (screen.x+1)/2 * canvas.width,
        y: (1-(screen.y+1)/2) * canvas.height, // invert y-axis
        z: screen.z,
        w: screen.w
    };
}
