import {strict as assert} from 'assert'
import {parseExport} from './parse-export.src.mjs'
export {parseExport} from './parse-export.src.mjs'
import {state} from './state.js'

void (() => {

	// Aim: 

	const o = parseExport(`/${state.testRoot}/x.js`, 'export const foo = () => {}')
	assert.equal(o, 'const foo = exports.foo = () => {}')
})()

void (() => {

	// Aim: 

	const o = parseExport(`/${state.testRoot}/x.js`, 'export class Foo {}')
	assert.equal(o, 'const Foo = exports.Foo = class Foo {}')
})()

void (() => {

	// Aim: 

	const o = parseExport(`/${state.testRoot}/x.js`, 'export class Foo extends Bar {}')
	assert.equal(o, 'const Foo = exports.Foo = class Foo extends Bar {}')
})()

void (() => {

	// Aim: 

	const o = parseExport(`/${state.testRoot}/x.js`, `export {foo} from './file.js'`)
	assert.equal(o, `exports.foo = module['/${state.testRoot}/file.js'].foo`)
})()

void (() => {

	// Aim: 

	const o = parseExport(`/${state.testRoot}/x.js`, `export {foo, bar} from './file.js'`)
	assert.equal(o, (
		`exports.foo = module['/${state.testRoot}/file.js'].foo\n`+
		`exports.bar = module['/${state.testRoot}/file.js'].bar`
	))
})()

void (() => {

	// Aim: 

	const o = parseExport(`/${state.testRoot}/x.js`, `export {foo as bar} from './file.js'`)
	assert.equal(o, `exports.bar = module['/${state.testRoot}/file.js'].foo`)
})()

void (() => {

	// Aim: 

	const o = parseExport(`/${state.testRoot}/x.js`, `export {foo, bar as baz} from './file.js'`)
	assert.equal(o, (
		`exports.foo = module['/${state.testRoot}/file.js'].foo\n`+
		`exports.baz = module['/${state.testRoot}/file.js'].bar`
	))
})()

void (() => {

	// Aim: 

	const o = parseExport(`/${state.testRoot}/x.js`, `export {foo, bar}`)
	assert.equal(o, `Object.assign(exports, {foo, bar})`)
})()

void (() => {

	// Aim: 

	const o = parseExport(`/${state.testRoot}/x.js`, `export {foo, bar as baz}`)
	assert.equal(o, (
		`exports.foo = foo\n`+
		`exports.baz = bar`
	))
})()

void (() => {

	// Aim: 

	const o = parseExport(`/${state.testRoot}/x.js`, `export * from './file.js'`)
	assert.equal(o, `Object.assign(exports, module['/${state.testRoot}/file.js'])`)
})()

void (() => {

	// Aim: 

	const o = parseExport(`/${state.testRoot}/x.js`, `export * as foo from './file.js'`)
	assert.equal(o, `exports.foo = module['/${state.testRoot}/file.js']`)
})()


void (() => {

	// Aim: Ensure that destructured exports are not supported.

	assert.throws(
		() => parseExport(`/${state.testRoot}/x.js`, 'export const {foo, baz: bar} = obj'),
		/Destructed export bindings are not supported/i
	)
})()
