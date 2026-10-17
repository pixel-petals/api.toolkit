/**
 * Where a vendored release's files live, and reading its SDL back.
 *
 * The layout is the sibling packages': the document at the version root in
 * every format it has, everything derived from it under `defs/`. Only the
 * formats differ — SDL and an introspection result, in place of JSON and YAML.
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { DEFS, DOCUMENT, documentPath, versionDir } from '@util/api/source/source.paths'

import { fileStem } from '#lib/sdl/sdl.name'

/** GraphQL's own format, and the one a release is vendored as. */
export const SDL = 'graphql'

/** The second whole-document format: the same schema, introspected. */
export const INTROSPECTION = 'json'

/**
 * Every type sits here. Nothing in an introspection schema is addressable the
 * way a `$ref` target is, so there is no shape to mirror and no second home
 * for a fragment to land in.
 */
const FRAGMENTS = 'fragments'

/** @returns {string} the fragment's path without an extension */
export function fragmentStem(root, version, name) {
  return resolve(versionDir(root, version), DEFS, FRAGMENTS, fileStem(name))
}

/**
 * The vendored SDL, which is the only thing `split` reads — so it works
 * offline and always describes the copy in the repo.
 *
 * @param {string} hint what to tell the user to run when nothing is vendored
 */
export function readSdl(root, version, hint) {
  try {
    return readFileSync(documentPath(root, version, SDL), 'utf8')
  } catch (error) {
    if (error.code !== 'ENOENT') throw error

    throw new Error(`no ${DOCUMENT}.${SDL} for ${version}${hint ? ` — run \`${hint}\` first` : ''}`)
  }
}
