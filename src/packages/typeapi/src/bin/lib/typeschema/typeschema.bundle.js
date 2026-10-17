/**
 * Bundling and unbundling a TypeSchema document.
 *
 * TypeSchema has no `$ref`. A document imports whole other documents under an
 * alias and refers into them with `alias:Name`, so bundling means folding an
 * imported document's definitions into the importer and rewriting those
 * qualified targets to local ones. See typeschema.md.
 */

import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

import { parser } from '@util/api/serialize/serialize.format'
import { fetchDocument } from '@util/api/source/source.fetch'

/** Where `fetch` puts the documents a specification imports. */
const IMPORTS = 'imports'

/**
 * A name for an imported definition that cannot collide with a local one.
 *
 * The alias is kept as a prefix rather than dropped, because two imports are
 * free to define the same name and the flattened document has one namespace.
 */
function localName(alias, name) {
  return `${alias}_${name}`
}

/** Rewrites every `alias:Name` target that now lives in this document. */
function relink(node, rename) {
  if (Array.isArray(node)) return node.map(value => relink(value, rename))

  if (!node || typeof node !== 'object') return node

  return Object.fromEntries(Object.entries(node).map(([ key, value ]) => {
    if (key === 'target' && typeof value === 'string' && rename.has(value)) return [ key, rename.get(value) ]

    return [ key, relink(value, rename) ]
  }))
}

/** An import is a URL when it looks like one, and a sibling file otherwise. */
async function load(specifier, from) {
  if (/^https?:/.test(specifier)) return fetchDocument(specifier)

  return parser('json')(readFileSync(resolve(from, specifier), 'utf8'))
}

/**
 * Folds every import into one document.
 *
 * `typehub://` specifiers name a registry that serves no document export, so
 * an import is resolvable only when `imports` maps the alias to a path or URL
 * that can actually be read. Anything else is left alone, and its targets stay
 * qualified — an honest partial bundle rather than a broken whole one.
 *
 * @param   {object}          document
 * @param   {object}          options
 * @param   {string}          options.from      directory relative specifiers resolve against
 * @param   {object}          [options.imports] alias -> a readable path or URL
 * @returns {Promise<object>}
 */
export async function bundle(document, { from, imports = {} }) {
  const definitions = { ...document.definitions }
  const rename = new Map()
  const unresolved = {}

  for (const [ alias, specifier ] of Object.entries(document.import ?? {})) {
    const source = imports[ alias ] ?? (/^https?:|^\.|^\//.test(specifier) ? specifier : null)

    if (!source) {
      unresolved[ alias ] = specifier
      continue
    }

    const imported = await load(source, from)

    for (const [ name, definition ] of Object.entries(imported.definitions ?? {})) {
      definitions[ localName(alias, name) ] = definition
      rename.set(`${alias}:${name}`, localName(alias, name))
    }
  }

  const bundled = {
    ...(Object.keys(unresolved).length ? { import: unresolved } : {}),
    definitions: relink(definitions, rename),
    root: document.root,
  }

  return bundled
}

/** Where a document's own imports resolve from. */
export function baseOf(file) {
  return dirname(resolve(file))
}

/**
 * Imports that are vendored beside the document.
 *
 * A `typehub://` specifier names a registry that serves no document export, so
 * an alias is otherwise unresolvable. `fetch` writes each imported document to
 * `imports/<alias>.json` for exactly this reason, and finding it there is what
 * lets the vendored specification bundle offline.
 */
export function vendoredImports(document, from) {
  const found = {}

  for (const alias of Object.keys(document.import ?? {})) {
    const candidate = resolve(from, IMPORTS, `${alias}.json`)

    if (existsSync(candidate)) found[ alias ] = candidate
  }

  return found
}
