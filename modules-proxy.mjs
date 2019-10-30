import {strict as assert} from 'assert'
import {createModulesProxy} from './modules-proxy.src.mjs'
export {createModulesProxy} from './modules-proxy.src.mjs'

void (() => {

	// Aim: Ensure that we get an object.

	const proxy = createModulesProxy()
	assert.equal(typeof proxy, 'object')
})()

void (() => {

	// Aim: Ensure that lookups cannot be undefined.

	const proxy = createModulesProxy()

	proxy['./file.js'] = 1
	assert.doesNotThrow(() => proxy['./file.js'])
	assert.equal(proxy['./file.js'], 1)
	assert.throws(
		() => proxy['./file-2.js'],
		/module .\/file-2.js is not defined/i
	)
})()

void (() => {

	// Aim: Ensure that assignments cannot be undefined.

	const proxy = createModulesProxy()
	assert.throws(
		() => proxy['./file.js'] = undefined,
		/cannot set module .\/file.js to undefined/i
	)
})()