import {strict as assert} from 'assert'
import {dirname} from 'path'
import {state} from './state.js'
import {transpileESM} from './main.src.mjs'
export {transpileESM} from './main.src.mjs'

const js = `
import {foo} from './file.js'

export const bar = () => {
	//
}
`
void (() => {

	//

	const o = transpileESM(`/${state.testRoot}/bar.js`, js)
	

})()