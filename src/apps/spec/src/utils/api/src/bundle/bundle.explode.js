/**
 * Unbundling: one document becomes a tree of files linked by `$ref`.
 *
 * The inverse of bundling. A piece is lifted out where the document itself
 * names it — an entry of a top-level collection, or of a reusable-object group
 * — and everything else stays in the root document. See bundle.md.
 */

import { resolve } from 'node:path'

import { DEFAULT_FORMATS } from '#serialize/serialize.format'
import { writeVariants } from '#serialize/serialize.variants'
import { directoryOf, pointerFor, repoint } from '#bundle/bundle.rewrite'
import { uniqueSlug } from '#bundle/bundle.name'

/** A map of named objects is what can be exploded; a scalar or array is not. */
function isNamedMap(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

/**
 * The positions a document names its own pieces at.
 *
 * The reusable-object map nests one level deeper than the rest: its keys are
 * groups, and the pieces are inside them.
 */
function* positions(document, { collections, componentsKey }) {
  for (const [ key, value ] of Object.entries(document)) {
    if (!isNamedMap(value)) continue

    if (key === componentsKey) {
      for (const [ group, entries ] of Object.entries(value)) {
        if (isNamedMap(entries)) yield { directory: [ key, group ], container: entries }
      }
      continue
    }

    if (collections.has(key)) yield { directory: [ key ], container: value }
  }
}

/**
 * @typedef {object} Piece
 * @property {string}  path    where the file goes, without an extension
 * @property {string}  pointer where it sat in the whole document
 * @property {unknown} value   what was lifted
 */

/**
 * Every piece to lift, and the shell left behind pointing at each.
 *
 * The shell's references are written as bare paths here; the extension is
 * added per format later, so one shell serves every format.
 */
function lift(document, options) {
  /** @type {Piece[]} */
  const pieces = []
  const shell = structuredClone(document)

  for (const { directory, container } of positions(shell, options)) {
    const taken = new Set()

    for (const [ key, value ] of Object.entries(container)) {
      // a piece already pointing elsewhere is someone else's file to write
      if (!isNamedMap(value) || value.$ref) continue

      const path = [ ...directory, uniqueSlug(key, taken) ].join('/')

      pieces.push({ path, pointer: pointerFor(directory, key), value })
      container[ key ] = { $ref: path }
    }
  }

  return { shell, pieces }
}

/**
 * Writes the tree.
 *
 * Each format gets its own copy, whose references name that format's files —
 * `spec.yaml` points at `.yaml` pieces and `spec.json` at `.json` ones — so a
 * toolchain never has to cross formats to resolve a reference.
 *
 * @param   {object}                            document
 * @param   {string}                            into                    directory to write the tree into
 * @param   {object}                            [options]
 * @param   {Set}                               [options.collections]   top-level keys holding named maps
 * @param   {string}                            [options.componentsKey]
 * @param   {string}                            [options.stem]          basename for the root document
 * @param   {string[]}                          [options.formats]
 * @returns {{files: string[], pieces: number}}
 */
export function explode(document, into, options = {}) {
  const {
    collections = new Set(),
    componentsKey = 'components',
    stem = 'spec',
    formats = DEFAULT_FORMATS,
  } = options

  const { shell, pieces } = lift(document, { collections, componentsKey })
  const lifted = new Map(pieces.map(piece => [ piece.pointer, piece.path ]))

  const files = pieces.flatMap(piece => writeVariants(
    resolve(into, piece.path),
    format => repoint(piece.value, { from: directoryOf(piece.path), lifted, root: stem, format }),
    formats,
  ))

  // the shell's own references are already relative to the root it will be
  // written as, so only the extension is still missing
  const roots = writeVariants(
    resolve(into, stem),
    format => extend(shell, format),
    formats,
  )

  return { files: [ ...roots, ...files ], pieces: pieces.length }
}

/**
 * Adds the format's extension to the bare paths `lift` left behind.
 *
 * @param {*} node arbitrary JSON, walked as it comes
 */
function extend(node, format) {
  if (Array.isArray(node)) return node.map(value => extend(value, format))

  if (!node || typeof node !== 'object') return node

  if (typeof node.$ref === 'string' && !node.$ref.startsWith('#')) {
    return { ...node, $ref: `./${node.$ref}.${format}` }
  }

  return Object.fromEntries(Object.entries(node).map(([ key, value ]) => [ key, extend(value, format) ]))
}
