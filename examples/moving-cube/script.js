import {rect} from '../../src/model.js';
import {clear} from '../../src/core.js';

let cube;
const refresh = time => {
    clear();

    const sec = time / 1000;

    const x = -0.5 + Math.sin(sec);
    const y = -0.5;
    const z = -3.5;

    cube = rect(x, y, z, 1, 1, 1, [
        {r: 1, g: 0, b: 0, a: 1},
        {r: 0, g: 1, b: 0, a: 1},
        {r: 0, g: 0, b: 1, a: 1},
        {r: 1, g: 0, b: 1, a: 1},
        {r: 0, g: 1, b: 1, a: 1},
        {r: 1, g: 1, b: 0, a: 1}
    ]);
	cube.render();

    window.requestAnimationFrame(refresh);
};

window.requestAnimationFrame(refresh);
