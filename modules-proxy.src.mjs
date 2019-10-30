export const createModulesProxy = () => {

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