/**
 * Writing a vendored release: the schema at the version root, one fragment
 * per introspection type beneath it.
 *
 * Overwrites freely — everything here is derived from the fetched section,
 * and refusing to overwrite would only make version bumps annoying.
 */

import { writeDocument } from '@util/api/serialize/serialize.write'
import { writeText } from '@util/api/serialize/serialize.text'
import { documentStem } from '@util/api/source/source.paths'

import { INTROSPECTION, SDL, fragmentStem } from '#lib/sdl/sdl.files'
import { introspect } from '#lib/sdl/sdl.introspect'
import { splitTypes } from '#lib/sdl/sdl.types'

/** @import { SdlType } from '#lib/sdl/sdl.types' */

/**
 * The schema in both formats, at the version root.
 *
 * The SDL is written verbatim — it is the fetched artefact, and a reader
 * should be able to diff it against the specification's own prose.
 *
 * @returns {string[]} the files written
 */
export function writeSchema(root, version, sdl) {
  const stem = documentStem(root, version)

  return [
    writeText(stem, sdl, SDL),
    ...writeDocument(stem, introspect(sdl), [ INTROSPECTION ]),
  ]
}

/**
 * @typedef {SdlType & {files: string[]}} WrittenType
 */

/**
 * One fragment per type, in both formats.
 *
 * The JSON side is the type's own entry in `__schema.types` — the same
 * description the whole-schema result carries, cut to one type, so a tool
 * that reads introspection can be pointed at a single type without slicing
 * the document itself.
 *
 * @returns {WrittenType[]}
 */
export function writeFragments(root, version, sdl) {
  const described = new Map(introspect(sdl).__schema.types.map(type => [ type.name, type ]))

  return splitTypes(sdl).map(type => {
    const stem = fragmentStem(root, version, type.name)
    const files = [ writeText(stem, type.sdl, SDL) ]

    // a declared type is always introspected; the guard is against a release that surprises us
    if (described.has(type.name)) files.push(...writeDocument(stem, described.get(type.name), [ INTROSPECTION ]))

    return { ...type, files }
  })
}
