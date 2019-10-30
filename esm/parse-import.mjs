import {strict as assert} from 'assert'
import {parseImport} from './parse-import.src.mjs'
export {parseImport} from './parse-import.src.mjs'
import {state} from './state.js'

void (() => {

	// Aim: Ensure that import './foo.js' style imports work.

	const o = parseImport(`/${state.testRoot}/x.js`, `import './baz.js'`)
	assert(o.endsWith(`void module['/${state.testRoot}/baz.js']`))
})()

void (() => {

	// Aim: Ensure that "* as foo" imports are parsed properly.

	const o = parseImport(`/${state.testRoot}/x.js`, `import * as foo from './baz.js // comment'`)
	assert(o.endsWith(`const foo = module['/${state.testRoot}/baz.js']`))
})()

void (() => {

	// Aim: Ensure that we can destructure imports.

	const o = parseImport(`/${state.testRoot}/x.js`, `import {foo} from './bar.js'`)
	assert(o.endsWith(`const {foo} = module['/${state.testRoot}/bar.js']`))
})()

void (() => {

	// Aim: Ensure that we can destructure multiple imports.

	const o = parseImport(`/${state.testRoot}/x.js`, `import {foo, bar} from './baz.js'`)
	assert(o.endsWith(`const {foo, bar} = module['/${state.testRoot}/baz.js']`))
})()

void (() => {

	// Aim: Ensure that aliases work.

	const o = parseImport(`/${state.testRoot}/x.js`, `import {foo as bar} from './baz.js'`)
	assert(o.endsWith(`const {foo: bar} = module['/${state.testRoot}/baz.js']`))
})()

void (() => {

	// Aim: Ensure that we can mixed aliases with plain destructuring.

	const o = parseImport(`/${state.testRoot}/x.js`, `import {foo as bar, baz} from './fizz.js'`)
	assert(o.endsWith(`const {foo: bar, baz} = module['/${state.testRoot}/fizz.js']`))
})()

void (() => {

	// Aim: Ensure that default imports don't work.

	assert.throws(
		() => parseImport(`/${state.testRoot}/x.js`, `import varname from './fizz.js'`),
		/syntax not supported/i
	)
})()