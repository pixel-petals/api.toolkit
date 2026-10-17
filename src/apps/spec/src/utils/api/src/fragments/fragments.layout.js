/**
 * Decides where each fragment file goes, from a normalized document.
 *
 * The document's own shape is the hierarchy: a fragment goes where an author
 * could point at it and say the file belongs there. Everything else is an
 * inline object with no canonical home, and lands in fragments/.
 * See fragments.md.
 */

import { DEFS } from '#source/source.paths'
import { camel } from '#fragments/fragments.name'

const FRAGMENTS = 'fragments'

/**
 * The two kinds of place a fragment provably belongs: a key of the document
 * root, and a key of a reusable-object map the root points at. Both are
 * addressable in a real document, so both are a home. Anything deeper is only
 * reachable through a parent that is itself inline, so its location would be
 * a guess.
 */
function homes(normalized) {
  const placed = new Map()

  const place = (name, path) => placed.set(name, [ ...(placed.get(name) ?? []), path ])

  for (const { key, collection, holds } of normalized.roots) {
    for (const name of holds) place(name, collection ? [ key, camel(name) ] : [ camel(key) ])
  }

  for (const { key, holds } of normalized.components) {
    for (const name of holds) place(name, [ normalized.componentsKey, key ])
  }

  // a document that defines a union names a group; MCP has nothing else
  for (const { key, holds } of normalized.unions ?? []) {
    for (const name of holds) place(name, [ camel(key), camel(name) ])
  }

  return placed
}

/**
 * @typedef {object} Fragment
 * @property {string[]} path  directory segments, then the file stem
 * @property {string}   def   the object name the file describes
 * @property {string[]} defs  every object it points at; many means a union
 * @property {boolean}  homed true when the document's shape placed it
 */

/**
 * Every fragment file to write, sorted by path.
 * @returns {Fragment[]}
 */
export function layout(normalized) {
  const placed = homes(normalized)

  return normalized.objects
    .map(({ name, targets }) => {
      // one home is a location; several is a guess, and none is a fragment
      const homed = placed.get(name)?.length === 1
      const home = homed ? placed.get(name)[ 0 ] : [ FRAGMENTS, camel(name) ]

      return { path: [ DEFS, ...home ], def: name, defs: targets, homed }
    })
    .sort((a, b) => a.path.join('/').localeCompare(b.path.join('/')))
}

/**
 * The pointers a fragment carries — relative, back into the vendored document,
 * so validation needs no network and stays pinned to the copy in the repo.
 * More than one means a reference union.
 *
 * A delegated Schema Object is the exception: some versions leave its
 * definition an empty stub so a document can pick its own dialect, and the
 * fragment targets that dialect instead.
 *
 * @returns {string[]}
 */
export function targets(normalized, fragment, documentFile) {
  if (normalized.dialect && normalized.isDelegated(fragment.def)) return [ normalized.dialect ]

  // every fragment sits at least one level down, under defs/
  const up = '../'.repeat(fragment.path.length - 1)

  return fragment.defs.map(name => `${up}${documentFile}${normalized.pointer(name)}`)
}
