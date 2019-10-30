import {strict as assert} from 'assert'
import {join, dirname} from 'path'
import {state} from './state.js'

const constBinding = (fname, src) => {

	// Transpiles an export of the form: "export const foo = ..." 

	const right = src.slice(src.indexOf('=') + 1).trim()
	if (src.startsWith('{')) {
		throw new Error(`Destructed export bindings are not supported: ${src}`)
	} else {
		const varName = src.split('=')[0].trim()
		state.exports[fname].push(varName)
		return `const ${varName} = exports.${varName} = ${right}`
	}
}

const classBinding = (fname, src) => {

	// Transpiles an export of the form: "export class Foo {}" 

	const className = src.split(' ')[0]
	const classDfn = src.slice(className.length)
	state.exports[fname].push(className)
	return `const ${className} = exports.${className} = class ${className}${classDfn}`
}

const propsBinding = (fname, src) => {

	const parentDir = dirname(fname)
	const propsOffset = src.indexOf('}')
	const props = src.slice(1, propsOffset).split(',').map(s => s.trim())

	if (src.includes(' from ')) {
		const fname = src.split(' from ').pop().slice(1, -1)
		const fpath = join(parentDir, fname)
		const assignments = props.map(prop => {
			let [from, to] = prop.split(' as ')
			return `exports.${to || from} = module['${fpath}'].${from}`
		})
		return assignments.join('\n')
	} else if (src.includes(' as ')) {
		const assignments = props.map(prop => {
			let [localVar, alias] = prop.split(' as ')
			return `exports.${alias || localVar} = ${localVar}`
		})
		return assignments.join('\n')
	} else {
		return `Object.assign(exports, {${props.join(', ')}})`
	}
}

const starBinding = (parentFname, src) => {

	const parentDir = dirname(parentFname)
	const fname = src.split(/\bfrom /).pop().slice(1, -1)
	const fpath = join(parentDir, fname)

	if (src.startsWith('as ')) {
		const alias = src.slice(2).trim().split(/\s/)[0]
		return `exports.${alias} = module['${fpath}']`
	} else {
		return `Object.assign(exports, module['${fpath}'])`
	}
}

export const parseExport = (fname, src) => {

	// SPECIFICATION ///////////////////////////////////////////////////

	// export const foo = anyValue
	// >>> const foo = exports.foo = anyValue

	// export class Foo {}
	// >>> const Foo = exports.Foo = class Foo {}

	// export {foo, bar} from './file.js'
	// >>> exports.foo = module['/root/file.js'].foo
	//     exports.bar = module['/root/file.js'].bar

	// export {foo as bar, fizz as buzz} from './file.js'
	// >>> exports.bar = module['/root/file.js'].foo
	//     exports.fizz = module['/root/file.js'].fizz

	// export {foo, bar, baz}
	// Object.assign(exports, {foo, bar, baz})

	// export {foo as bar, fizz as buzz}
	// >>> exports.bar = foo
	// 	   exports.buzz = fizz

	// export * from './file.js'
	// >>> Object.assign(exports, module['/root/file.js'])

	// export * as foo from './file.js'
	// >>> exports.foo = module['/root/file.js']

	////////////////////////////////////////////////////////////////////

	assert.equal(typeof fname, 'string')
	assert.equal(typeof src, 'string')
	assert(fname.startsWith('/'))
	assert(src.startsWith('export '))

	state.exports[fname] = []

	src = src.slice(6).trim() // drop 'export' token

	if (src.startsWith('const ')) {
		src = src.slice(5).trim()
		return constBinding(fname, src)
	}
	if (src.startsWith('class ')) {
		src = src.slice(5).trim()
		return classBinding(fname, src)
	}
	if (src.startsWith('{')) {
		return propsBinding(fname, src)
	}
	if (src.startsWith('*')) {
		src = src.slice(1).trim()
		return starBinding(fname, src)
	}
}