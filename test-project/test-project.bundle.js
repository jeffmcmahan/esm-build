throw '/foo.js does not export "bar".';

;

;(() => {'use strict'

const createModulesProxy = () => {

	// Creates a proxy object that does not tolerate undefined key lookups.
	// => Object - new Proxy() returns an Object

	return new Proxy({}, {
		get: (target, prop) => {
			if (!(prop in target)) {
				throw new Error(`Module ${prop} is not defined.`)
			}
			return target[prop]
		},
		set: (target, prop, value) => {
			if (typeof value === 'undefined') {
				throw new Error(`Cannot set module ${prop} to undefined.`)
			}
			return target[prop] = value
		}
	})
}
const module = createModulesProxy()

module['/foo.js'] = (exports => {
	const foo = exports.foo = console.log('foo!')
	return exports
})(createModulesProxy())

module['/index.js'] = (exports => {
	const {foo, bar} = module['/foo.js']
	
	foo()
	return exports
})(createModulesProxy())

})()