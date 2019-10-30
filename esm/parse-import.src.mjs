import {strict as assert} from 'assert'
import {join, dirname} from 'path'
import {stripComments} from './strip-comments.mjs'
import {state} from './state.js'

const parseBindings = (fname, list) => {

	// Turns the list of binding expressions into code strings that
	// can be easily compiled into working JS assignments.
	// => Array<Object>

	assert.equal(typeof fname, 'string')
	assert.equal(typeof list, 'string')

	if (list.startsWith('*')) {
		const varName = list.split(' as ').pop().trim()
		state.imports[fname].push(varName)
		return `const ${varName} =`
	} else if (list.startsWith('{')) {
		const varsSrc = list.slice(1,-1).trim() // Remove brackets.
		const vars = varsSrc.split(',').map(s => s.trim())
		const props = vars.map(src => {
			if (src.includes(' as ')) {
				return src.replace(' as ', ': ')
			}
			return src
		})
		state.imports[fname].push(...props)
		return `const {${props.join(', ')}} =`
	} else {
		throw new Error(`Syntax not supported: "${list}".\n\n    See: ${fname}.\n`)
	}
}

export const parseImport = (fname, ln) => {

	// Parses a single import statement (from a single line).
	// => Object - {bindings, from}

	// SPECIFICATION ///////////////////////////////////////////////////

	// import './file.js'
	// >>> void module['/root/file.js']

	// import * as foo from './file.js'
	// >>> const foo = module['/root/file.js']

	// import {foo} from './file.js'
	// >>> const {foo} = module['/root/file.js']

	// import {foo as bar} from './file.js'
	// >>> const {foo: bar} = module['/root/file.js']

	// import {foo, bar} from './file.js'
	// >>> const {foo, bar} = module['/root/file.js']

	// import {foo, bar as baz} from './file.js'
	// >>> const {foo, bar: baz} = module['/root/file.js']

	////////////////////////////////////////////////////////////////////

	assert.equal(typeof fname, 'string')
	assert.equal(typeof ln, 'string')
	assert(fname.startsWith('/'))
	assert(ln.startsWith('import '))

	const parentDir = dirname(fname)
	const src = stripComments(ln.trim()).slice(7).trim()

	if (src.includes(' from ')) {
		// import x from './y.js'
		const [left, right] = src.split(' from ').map(s => s.trim())
		const fpath = join(parentDir, right.slice(1, -1).trim())
		state.imports[fpath] = []
		const bindings = parseBindings(fpath, left)
		assert(bindings.endsWith('='))
		assert(fpath.endsWith('.js') || fpath.endsWith('.mjs'))
		return `${bindings} module['${fpath}']`
	} else {
		// import './foo.js'
		const fpath = join(parentDir, src.slice(1, -1).trim())
		state.imports[fpath] = []
		return `void module['${fpath}']`
	}
}