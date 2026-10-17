/**
 * Locating a vendored protobuf release.
 *
 * The tree is the siblings' tree — one directory per version, the source
 * document at its root, everything derived under `defs/` — so the paths that
 * do not depend on the format come straight from the shared helpers.
 */

import { resolve } from 'node:path'

import { DEFS, documentStem, versionDir } from '@util/api/source/source.paths'

/** Protobuf's first-class format: the schema is IDL, not an object encoding. */
export const IDL = 'proto'

/** Per-declaration fragments, kept apart from the vendored `.proto` files. */
export const FRAGMENTS = 'fragments'

/** The vendored `descriptor.proto`. */
export function schemaFile(root, version) {
  return `${documentStem(root, version)}.${IDL}`
}

/** Where the well-known types land, and the fragments beneath them. */
export function defsDir(root, version) {
  return resolve(versionDir(root, version), DEFS)
}

export function fragmentsDir(root, version) {
  return resolve(defsDir(root, version), FRAGMENTS)
}
