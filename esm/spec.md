# An ESModules Implementation (of a kind)

This project implements a subset of the ESModules spec for browser builds; it (very wisely!) omits the following:

- Third-party module resolution, since it is a bad feature (use published builds).
- Cyclic resolution, since it is a stupid, dangerous feature.
- `default` exports, since it is a *terrible* feature.
- `import.meta`, since it is of no use in the browser.
- Dynamic `import()`, since it is not relevant for bundling.
- Absolute import paths, since they are brittle.
- `export function` since `function` is a bad part of JS.
- Destructuring exports since they're gross.

The intention is to author code with familiar syntax, but that only imports code via local, relative file paths. External dependencies (React, say) are to be handled with globals, in the classic JS fashion.

The approach taken here is not file-size efficient, but it leaves file names in stack traces as well as in the code, which makes it easy to debug the code. *All* I care about is *bugs,* and if you are any different, you are filthy rotten *fool.* A nothing. A joke of a man.

## import

Imports will be compiled exactly as indicated below:

```js
import './file.js'
>>> void module['/root/file.js']

import * as foo from './file.js'
>>> const foo = module['/root/file.js']

import {foo} from './file.js'
>>> const {foo} = module['/root/file.js']

import {foo as bar} from './file.js'
>>> const {foo: bar} = module['/root/file.js']

import {foo, bar} from './file.js'
>>> const {foo, bar} = module['/root/file.js']

import {foo, bar as baz} from './file.js'
>>> const {foo, bar: baz} = module['/root/file.js']
```

There is an additional condition on each import binding: it must not be undefined.

## export

Exports will be compiled exactly as indicated below:

```js
export const foo = anyValue
>>> const foo = exports.foo = anyValue

export class Foo {}
>>> const Foo = exports.Foo = class Foo {}

export {foo, bar, baz}
>>> Object.assign(exports, {foo, bar, baz})

export {foo as bar, fizz as buzz}
>>> exports.bar = foo
    exports.buzz = fizz

export * from './file.js'
>>> Object.assign(exports, module['/root/file.js'])

export * as foo from './file.js'
>>> exports.foo = module['/root/file.js']

export {foo, bar} from './file.js'
>>> exports.foo = module['/root/file.js'].foo
    exports.bar = module['/root/file.js'].bar

export {foo as bar, fizz as buzz} from './file.js'
>>> exports.bar = module['/root/file.js'].foo
    exports.fizz = module['/root/file.js'].fizz
```

## Outer Context

There is a namespace object, `module` (referenced above), which is extended with one key-value by each file/module. The key is a root-relative file path and the value is an `Object` instance, assigned properties by the file/module's transpiled `export` statements. To achieve that, each javascript file is wrapped as follows:

```js
module['/root/file.js'] = (exports => {
	<<code>>
	;return exports
})()
```

The bundle of modules is then wrapped as follows:

```js
;(() => {
	'use strict'
	const module = {}
	<<bundled-modules>>
})();
```

## Static-ness

You really should only use named imports and exports, so that you don't have to worry about failing property lookups on imported namespace objects.

```js
import * as foo from './foo.mjs'	// Bad.
import {foo} from './foo.mjs'		// Good.
```

The latter case requires the importing and the exporting file to agree on what the exporting file actually exports, preventing dreaded "such and such is undefined" errors. This implementation keeps this promise; a named import without a corresponding value will trigger an immediate error.
