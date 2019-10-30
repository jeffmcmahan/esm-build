import {strict as assert} from 'assert'
import {parseExport} from './parse-export.mjs'
import {parseImport} from './parse-import.mjs'

export const transpileESM = (fname, src) => {

	// 
	// => string

	assert.equal(typeof fname, 'string')
	assert.equal(typeof src, 'string')

	const lines = src.split('\n')
		.map(ln => {
			if (ln.trim().startsWith('import ')) {
				return parseImport(fname, ln)
			}
			return ln
		})
		.map(ln => {
			if (ln.trim().startsWith('export ')) {
				return parseExport(fname, ln)
			}
			return ln
		})

	src = lines.map(ln => ('\t' + ln)).join('\n')

	return (
		`module['${fname}'] = (exports => {\n`+
			src + '\n\t' +
			'return exports\n'+
		'})(createModulesProxy())'
	)
}