import {execSync} from 'child_process'
import {promises as fs} from 'fs'
import {join, basename, isAbsolute} from 'path'
import {transpileESM} from './esm/main.mjs'
import {createModulesProxy} from './modules-proxy.mjs'
import {state} from './esm/state.js'

const makeAbsolute = (root, path) => {

	// Ensures that the given path is an absolute path.
	// => string

	if (isAbsolute(path)) {
		return path
	}
	return join(root, path)
}

const indent = (src, depth = 1) => {
	const ind = Array(depth).join('\t')
	return src.split('\n').join('\n' + ind)
}

const getDepsBundle = async deps => {

	// Bundles the dependencies into a single string.
	// => string

	const readOps = deps.map(fpath => fs.readFile(fpath, 'utf8'))
	const code = await Promise.all(readOps)
	return code.join(';\n\n')
}

const resolveOrder = files => {

	// Quick-and-dirty way of getting a valid dependency ordering.
	// N.b.: No cyclic resolution.
	// => Array<Object>

	let count = 0
	const limit = ((files.length**2) + 10)
	for (let defPos = 0; defPos < files.length; defPos++) {
		if ((count + 10) > limit) {
			console.log(files[defPos].fpath)
		}
		if (count > limit) {
			throw new Error('Dependencies are circular.')
		}
		const dfn = files[defPos]
		if (files.some((file, includePos) => (
			(defPos > includePos) &&
			(file.code.includes('\'' + dfn.fpath + '\''))
		))) {
			files.splice(defPos, 1) 			// Remove the dfn
			files.splice((defPos - 1), 0, dfn) 	// Move it one step backward.
			defPos = 0 							// Start over.
			count++
			continue
		}
	}
	return files
}

export const bundleEsm = async ({root, deps = [], exclude = [], dest = './bundle.js'}) => {
	
	const transpileFiles = () => {

		// Converts the files from ESM to define-and-call.
		// => Array<string>

		deps = deps.map(fname => makeAbsolute(root, fname))
		exclude = exclude.map(fname => makeAbsolute(root, fname))
		dest = makeAbsolute(root, dest)

		const files = execSync(`cd ${root} && find . -type f`)
			.toString().trim().split('\n')
			.map(fname => join(root, fname))
			.filter(fname => fname.endsWith('.js') || fname.endsWith('.mjs'))
			.filter(fname => !basename(fname).startsWith('.'))
			.filter(fname => fname !== dest)
			.filter(fname => !deps.includes(fname))
			.filter(fname => !exclude.some(excluded => {
				return fname.startsWith(excluded)
			}))

		const ops = files.map(async fpath => {
			const src = await fs.readFile(fpath, 'utf8').catch(e => {
				console.log(e)
				process.exit(1)
			})
			return {fpath, code: transpileESM(fpath, src)}
		})

		return Promise.all(ops)
	}

	// Bundle the code.
	const depsBundle = await getDepsBundle(deps).catch(console.log)
	const transpiledFiles = await transpileFiles().catch(console.log)
	const ordered = resolveOrder(transpiledFiles)
	const code = ordered.map(file => file.code).join('\n\n').split(root).join('')
	const wrapped = [
		`;(() => {'use strict'\n`,
			`const createModulesProxy = ${indent(createModulesProxy.toString())}`,
			`const module = createModulesProxy()`,
			`\n${code}\n`,
		`})()`
	].join('\n')

	const warnings = []
	Object.keys(state.imports)
		.filter(fname => !fname.includes(state.testRoot))
		.forEach(fname => {
			state.imports[fname].forEach(prop => {
				if (!state.exports[fname]) {
					warnings.push(`${fname} was not within root.`)
				} else if (!state.exports[fname].includes(prop)) {
					warnings.push(`${fname.split(root).join('')} does not export "${prop}".`)
				}
			})
		})

	const errors = warnings.map(msg => `throw '${msg}'`).join(';\n')

	// Write to disk.
	const outputCode = (errors + ';\n\n' + depsBundle + ';\n\n' + wrapped)
	await fs.writeFile(dest, outputCode).catch(e => {
		console.log(e)
		process.exit(1)
	})

	// Check syntax
	const syntaxCheck = execSync(`node --experimental-modules -c ${dest}`)
	console.log(syntaxCheck.toString())

	console.log(`Bundled ${ordered.length} files:`)
	console.log(ordered.map(file => file.fpath).join('\n'))
	console.log(`\nOutput:\n${dest}`)

	if (warnings.length) {
		console.log('\nWARNING:')
		console.log(warnings.join('\n'))
	}
}