/**
 * Unbundling: one document becomes a file per definition.
 *
 * The inverse of the merge, and the same operation `split` performs on a
 * vendored release — pointed at any schema, and taking the whole document
 * rather than its types alone.
 *
 * The tree is flat. GraphQL has nothing a `$ref` could address, so there is
 * no document shape to mirror and no second home a definition belongs in.
 */

import { resolve } from 'node:path'

import { writeText } from '@util/api/serialize/serialize.text'

import { stemFor } from '#lib/bundle/bundle.name'
import { SDL } from '#lib/sdl/sdl.files'
import { splitDefinitions } from '#lib/sdl/sdl.types'

/** @import { SdlDefinition } from '#lib/sdl/sdl.types' */

/** @typedef {SdlDefinition & {file: string}} WrittenDefinition */

/**
 * Writes the tree, and says what went where.
 *
 * @param   {string}              sdl  the whole document
 * @param   {string}              into directory to write into
 * @returns {WrittenDefinition[]}
 */
export function explode(sdl, into) {
  const taken = new Set()

  return splitDefinitions(sdl).map(definition => ({
    ...definition,
    file: writeText(resolve(into, stemFor(definition, taken)), definition.sdl, SDL),
  }))
}
