import {rect} from '../../src/model.js';
import {fragment, flush} from '../../src/core.js';
import {triangle} from '../../src/util.js';

const main = () => {
	let cube = rect(-0.5, -0.5, -3.5, 1, 1, 1, [
		{r: 1, g: 0, b: 0, a: 1},
		{r: 0, g: 1, b: 0, a: 1},
		{r: 0, g: 0, b: 1, a: 1},
		{r: 1, g: 0, b: 1, a: 1},
		{r: 0, g: 1, b: 1, a: 1},
		{r: 1, g: 1, b: 0, a: 1}
	]);
	cube.render();
	// for (let y=0; y<10; y++) {
	// 	for (let x=0; x<10; x++)
	// 		fragment({x: x, y: y, z: -1, w: -1}, {r: y/10, g: 1-x/10, b: 1, a: 1});
	// }
	// flush();
	// triangle(0, 0, 20, 40, 40, 20, (x, y) => {
	// 	fragment(x, y, null, -1, 1, 1, 1, 1);
	// 	// console.log(x, y);
	// });
	// flush();
}
window.addEventListener('load', main);
