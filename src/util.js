// https://stackoverflow.com/a/4672319/3783155
/** Draws a generic line */
export function line(x0, y0, x1, y1, pixel){
    var dx = Math.abs(x1-x0);
    var dy = Math.abs(y1-y0);
    var sx = (x0 < x1) ? 1 : -1;
    var sy = (y0 < y1) ? 1 : -1;
    var err = dx-dy;

    while(true){
        pixel(x0,y0);

        // if (Math.abs(x0-x1)<0.0001 && Math.abs(y0-y1)<0.0001) break;
        if ((sx == 1 ? x0>=x1 : x0<=x1) && (sy == 1 ? y0>=y1 : y0<=y1)) break;
        var e2 = 2*err;
        if (e2 >-dy){ err -= dy; x0  += sx; }
        if (e2 < dx){ err += dx; y0  += sy; }
    }
}

export function interpolateLinear(x1, x2, t) {
    return t * (x2 - x1) + x1;
}

// TODO: I could use the bresenham version of triangle filling instead? oh well for now

function sortVerticesY(components) {
    return components
        // to vectors array
        .reduce((vertices, comp, i, array) => {
            if (i % 2 === 0) return vertices.concat([{x: comp, y: array[i+1]}]);
            return vertices;
        }, [])
        // perform sort
        .sort((a, b) => Math.sign(a.y - b.y))
        // back to flat array
        .reduce((result, v) => result.concat([v.x, v.y]), []);
}

// NOTE: *ALL THE Y'S* are inverted here, but it doens't effect the result, only the wording
function fillBottomFlatTriangle(x1, y1, x2, y2, x3, y3, pixel) {
    // sort so that higher y is first
    [x1, y1, x2, y2, x3, y3] = sortVerticesY([x1, y1, x2, y2, x3, y3]);

    let invslope1 = (x2 - x1) / (y2 - y1);
    let invslope2 = (x3 - x1) / (y3 - y1);

    let curx1 = x1;
    let curx2 = x1;

    for (let scanlineY = y1; scanlineY <= y2; scanlineY++) {
        line(Math.floor(curx1), scanlineY, Math.floor(curx2), scanlineY, pixel);
        curx1 += invslope1;
        curx2 += invslope2;
    }
}

function fillTopFlatTriangle(x1, y1, x2, y2, x3, y3, pixel) {
    // sort so that higher y is first
    [x1, y1, x2, y2, x3, y3] = sortVerticesY([x1, y1, x2, y2, x3, y3]);

    let invslope1 = (x3 - x1) / (y3 - y1);
    let invslope2 = (x3 - x2) / (y3 - y2);

    let curx1 = x3;
    let curx2 = x3;

    for (let scanlineY = y3; scanlineY > y1; scanlineY--) {
        line(Math.floor(curx1), scanlineY, Math.floor(curx2), scanlineY, pixel);
        curx1 -= invslope1;
        curx2 -= invslope2;
    }
}

export function triangle(x1, y1, x2, y2, x3, y3, pixel) {
    /* at first sort the three vertices by y-coordinate ascending so v1 is the topmost vertice */
    // sort so that higher y is first
    [x1, y1, x2, y2, x3, y3] = sortVerticesY([x1, y1, x2, y2, x3, y3]);

    /* here we know that v1.y <= y2 <= y3 */
    /* check for trivial case of bottom-flat triangle */
    if (y2 == y3)
        fillBottomFlatTriangle(x1, y1, x2, y2, x3, y3, pixel);
    /* check for trivial case of top-flat triangle */
    else if (y1 == y2)
        fillTopFlatTriangle(x1, y1, x2, y2, x3, y3, pixel);
    else {
        /* general case - split the triangle in a topflat and bottom-flat one */
        let x4 = Math.floor(x1 + ((y2 - y1) / (y3 - y1)) * (x3 - x1));
        let y4 = y2;
        fillBottomFlatTriangle(x1, y1, x2, y2, x4, y4, pixel);
        fillTopFlatTriangle(x2, y2, x4, y4, x3, y3, pixel);
    }
}
