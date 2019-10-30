import {dirname, join} from 'path'
import {bundleEsm} from './main.src.mjs'
export {bundleEsm} from './main.src.mjs'

bundleEsm({
	root: join(dirname(import.meta.url.slice(7)), './test-project'),
	exclude: [],
	deps: [],
	dest: './test-project.bundle.js'
})