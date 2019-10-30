import {strict as assert} from 'assert'

export const stripComments = ln => {

	// Removes a trailing line comment from the line.
	// => string

	assert.equal(typeof ln, 'string')

	if (ln.includes('//')) {
		const commentOnset = ln.indexOf('//')
		return ln.slice(0, (commentOnset + 1)).trim()
	}
	return ln
}