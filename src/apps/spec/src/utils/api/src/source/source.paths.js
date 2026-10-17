/**
 * Locating a vendored specification tree.
 *
 * One directory per version, each holding the fetched document and a `defs/`
 * of everything derived from it. Every path is relative to a root the caller
 * owns, so a package decides where its schemas live and this decides nothing.
 */

import { existsSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

/** The basename each version vendors its source document as. */
export const DOCUMENT = 'schema'

/** Everything generated sits under here, leaving the fetched document alone. */
export const DEFS = 'defs'

export function versionDir(root, version) {
  return resolve(root, version)
}

/** The vendored document's path without an extension — the formats decide it. */
export function documentStem(root, version) {
  return resolve(versionDir(root, version), DOCUMENT)
}

export function documentPath(root, version, format = 'json') {
  return `${documentStem(root, version)}.${format}`
}

/**
 * The versions already vendored.
 *
 * Keyed on the format a specification actually fetches, not always JSON: a
 * protobuf release is vendored the moment its IDL is on disk, and the JSON
 * beside it is derived.
 */
export function versions(root, format = 'json') {
  if (!existsSync(root)) return []

  return readdirSync(root, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .filter(name => existsSync(documentPath(root, name, format)))
    .sort()
}
