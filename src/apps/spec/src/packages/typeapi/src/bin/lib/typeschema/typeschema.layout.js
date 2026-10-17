/**
 * Decides where each TypeSchema fragment goes.
 *
 * The rule matches the JSON Schema packages: a fragment sits where the
 * document's own shape puts it, and anything with no single home — or more
 * than one — goes flat in fragments/.
 */

import { DEFS } from '@util/api/source/source.paths'
import { camel } from '@util/api/fragments/fragments.name'

import { isCollection, referenceTarget } from '#lib/typeschema/typeschema.refs'

const FRAGMENTS = 'fragments'

/**
 * The two places a TypeSchema document names a type: a property of its root
 * struct, and a branch of a discriminated base.
 *
 * A base like `Security` maps a discriminator value to each concrete form, so
 * those forms belong under it the way a components key's entries do.
 */
function homes(definitions, root) {
  const placed = new Map()

  const place = (name, path) => placed.set(name, [ ...(placed.get(name) ?? []), path ])

  for (const [ key, node ] of Object.entries(definitions[ root ]?.properties ?? {})) {
    const target = referenceTarget(node)

    if (target) place(target, isCollection(node) ? [ key, camel(target) ] : [ camel(key) ])
  }

  // a mapping is keyed by type name, valued by the discriminator string it
  // answers to — the types are the keys
  for (const [ name, definition ] of Object.entries(definitions)) {
    for (const branch of Object.keys(definition.mapping ?? {})) place(branch, [ camel(name), camel(branch) ])
  }

  return placed
}

/**
 * @typedef {object} TypeFragment
 * @property {string[]} path  directory segments, then the file stem
 * @property {string}   def   the definition the file describes
 * @property {boolean}  homed true when the document's shape placed it
 */

/**
 * Every fragment to write, sorted by path. The root type is excluded — it is
 * the vendored document itself, not a fragment of it.
 *
 * @returns {TypeFragment[]}
 */
export function layout(definitions, root) {
  const placed = homes(definitions, root)

  return Object.keys(definitions)
    .filter(name => name !== root)
    .map(name => {
      // one home is a location; several is a guess, and none is a fragment
      const homed = placed.get(name)?.length === 1
      const home = homed ? placed.get(name)[ 0 ] : [ FRAGMENTS, camel(name) ]

      return { path: [ DEFS, ...home ], def: name, homed }
    })
    .sort((a, b) => a.path.join('/').localeCompare(b.path.join('/')))
}
