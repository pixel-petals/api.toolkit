/**
 * Unbundling: one descriptor becomes a tree of files, one per declaration.
 *
 * A protobuf descriptor has no `$ref`, so the pieces cannot point at each
 * other the way the JSON Schema packages' do. Each piece is instead a namespace
 * document carrying one declaration inside the packages it is declared in, and
 * the root document records where each declaration went.
 *
 * A piece is read with `root.addJSON(piece.nested)`, not `Root.fromJSON`: that
 * one resolves as it loads, and a declaration naming a type that lives in
 * another piece has nothing to resolve against until the tree is back
 * together. Adding every piece to one root reconstitutes the bundle exactly.
 * See readme.md.
 */

import { resolve } from 'node:path'

import protobuf from 'protobufjs'

import { uniqueSlug } from '@util/api/bundle/bundle.name'
import { camel } from '@util/api/fragments/fragments.name'
import { writeDocument } from '@util/api/serialize/serialize.write'

import { topLevel } from '#lib/proto/proto.declarations'

/** @import { Root } from 'protobufjs' */
/** @import { Declaration } from '#lib/proto/proto.declarations' */

/** JSON is the only encoding protobuf's toolchain round-trips. */
const FORMAT = 'json'

/** What marks the root document as the index of a tree rather than a schema. */
const TREE = 'protobuf-descriptor'

/**
 * @typedef {object} Piece
 * @property {string} name
 * @property {string} fullName
 * @property {string} kind
 * @property {string} file     where it was written, relative to the tree root
 */

/**
 * The descriptor, as an object graph to walk.
 *
 * `fromJSON` resolves as it loads, so a bundle that is not self-contained is
 * rejected here rather than exploded into a tree of half-answers.
 *
 * @returns {Root}
 */
function rootOf(descriptor) {
  try {
    return protobuf.Root.fromJSON(descriptor)
  } catch (error) {
    throw new Error(`not a protobuf descriptor: ${error.message}`)
  }
}

/**
 * The namespace chain a declaration sits in, rebuilt around it alone.
 *
 * The enclosing packages carry the file's options — `java_package` and its
 * neighbours land on the namespace, not on the message — so a piece that
 * dropped them would describe the declaration in the wrong package.
 */
function wrap(node) {
  let nested = { [ node.name ]: node.toJSON({ keepComments: true }) }

  // the root itself is unnamed and holds nothing of its own
  for (let scope = node.parent; scope?.parent; scope = scope.parent) {
    nested = { [ scope.name ]: { ...(scope.options ? { options: scope.options } : null), nested } }
  }

  return nested
}

/** The package a declaration is declared in, as directory segments. */
function packageOf(declaration) {
  return declaration.fullName.split('.').slice(0, -1)
}

/**
 * A piece: enough identity to read it on its own, and the namespace document
 * `addJSON` takes unchanged.
 *
 * @param {Declaration} declaration
 */
function piece(declaration) {
  return {
    name: declaration.name,
    fullName: declaration.fullName,
    kind: declaration.kind,
    package: packageOf(declaration).join('.'),

    nested: wrap(declaration.node),
  }
}

/**
 * Where a piece goes: its package as directories, its name as the file.
 *
 * Package segments stay as the schema spells them, because they are the name
 * a `.proto` resolves against. Only the declaration is camelCased, which is
 * the naming every other fragment in the repo uses.
 */
function pathOf(declaration, taken) {
  const directory = packageOf(declaration)
  const key = directory.join('/')

  if (!taken.has(key)) taken.set(key, new Set())

  return [ ...directory, uniqueSlug(camel(declaration.name), taken.get(key)) ]
}

/**
 * @param   {Declaration[]} found
 * @returns {Piece[]}
 */
function writePieces(found, into) {
  const taken = new Map()

  return found.map(declaration => {
    const path = pathOf(declaration, taken)

    writeDocument(resolve(into, ...path), piece(declaration), [ FORMAT ])

    return {
      name: declaration.name,
      fullName: declaration.fullName,
      kind: declaration.kind,
      file: `./${path.join('/')}.${FORMAT}`,
    }
  })
}

/**
 * The root document: what this tree came from, and where every declaration in
 * it landed. It is an index rather than a schema — a descriptor with holes
 * punched in it would still parse, and would lie about what the schema says.
 */
function writeIndex(pieces, into, { source, stem }) {
  const index = { tree: TREE, source, declarations: pieces }

  const [ file ] = writeDocument(resolve(into, stem), index, [ FORMAT ])

  return file
}

/**
 * @typedef {object} Tree
 * @property {string[]} files  every file written, the root document first
 * @property {Piece[]}  pieces the declarations lifted out
 */

/**
 * Writes the tree.
 *
 * @param   {object} descriptor       a bundled namespace tree
 * @param   {string} into             directory to write the tree into
 * @param   {object} [options]
 * @param   {string} [options.source] the descriptor's filename, for provenance
 * @param   {string} [options.stem]   basename for the root document
 * @returns {Tree}
 */
export function explodeDescriptor(descriptor, into, options = {}) {
  const { source = '', stem = 'spec' } = options

  const pieces = writePieces(topLevel(rootOf(descriptor)), into)
  const root = writeIndex(pieces, into, { source, stem })

  return { files: [ root, ...pieces.map(found => resolve(into, found.file)) ], pieces }
}
