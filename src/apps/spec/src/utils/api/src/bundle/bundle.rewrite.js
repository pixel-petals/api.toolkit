/**
 * Repointing references once a document has been taken apart.
 *
 * An internal pointer like `#/components/responses/PetList` is only meaningful
 * while the whole document is one file. The moment a piece becomes its own
 * file, `#` means *that* file's root, and the pointer resolves to nothing.
 *
 * So every reference is rewritten relative to wherever it now lives: at the
 * piece it names, if that piece was lifted, and otherwise back at the root
 * document, which still holds everything that was not.
 */

import { dirname, relative } from 'node:path/posix'

/** JSON Pointer escapes `~` and `/` inside a key. */
export function escapePointer(key) {
  return key.replaceAll('~', '~0').replaceAll('/', '~1')
}

/** Where a piece sat in the whole document, as a JSON Pointer. */
export function pointerFor(directory, key) {
  return `#/${[ ...directory, escapePointer(key) ].join('/')}`
}

/** A relative reference between two file paths, forward-slashed and explicit. */
function between(fromDirectory, to) {
  const path = relative(fromDirectory, to) || '.'

  return path.startsWith('.') ? path : `./${path}`
}

/**
 * Rewrites every internal reference in a node.
 *
 * @param {*}      node         arbitrary JSON, walked as it comes
 * @param {object} where
 * @param {string} where.from   directory the node will be written to
 * @param {Map}    where.lifted pointer -> the path its piece went to
 * @param {string} where.root   path of the root document, without extension
 * @param {string} where.format extension the references should name
 */
export function repoint(node, { from, lifted, root, format }) {
  const rewrite = value => repoint(value, { from, lifted, root, format })

  if (Array.isArray(node)) return node.map(rewrite)

  if (!node || typeof node !== 'object') return node

  if (typeof node.$ref === 'string' && node.$ref.startsWith('#')) {
    return { ...node, $ref: target(node.$ref, { from, lifted, root, format }) }
  }

  return Object.fromEntries(Object.entries(node).map(([ key, value ]) => [ key, rewrite(value) ]))
}

/**
 * Where one internal pointer should now point.
 *
 * A pointer at a lifted piece becomes that file. Anything else stays a pointer,
 * but against the root document rather than the current file — `info`,
 * `openapi` and every unlifted branch still live there.
 *
 * @param {string} pointer
 * @param {object} where   the same shape `repoint` takes
 */
function target(pointer, { from, lifted, root, format }) {
  const piece = lifted.get(pointer)

  if (piece) return `${between(from, piece)}.${format}`

  return `${between(from, root)}.${format}${pointer}`
}

/** The directory a piece's file sits in, for computing references out of it. */
export function directoryOf(path) {
  return dirname(path) === '.' ? '' : dirname(path)
}
