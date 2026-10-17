/**
 * Writes the fragment files a layout calls for, in every requested format.
 *
 * Overwrites freely — fragments are derived artefacts with nothing
 * hand-written in them, and refusing to overwrite would only make version
 * bumps annoying.
 */

import { resolve } from 'node:path'

import { DEFAULT_FORMATS } from '#serialize/serialize.format'
import { writeVariants } from '#serialize/serialize.variants'
import { DOCUMENT } from '#source/source.paths'
import { layout, targets } from '#fragments/fragments.layout'

/**
 * A fragment is a pointer and nothing else — the indirection *is* the feature.
 *
 * It declares the draft of the document it points into, not a fixed one: a
 * 2020-12 wrapper around a draft-04 target is a cross-draft reference, and
 * validators disagree about what that means.
 */
function wrapper(draft, pointers) {
  const body = pointers.length === 1
    ? { $ref: pointers[ 0 ] }
    : { oneOf: pointers.map($ref => ({ $ref })) }

  return { $schema: draft, ...body }
}

/**
 * Writes every fragment for a normalized document.
 *
 * Each format points at its own copy of the source — a YAML fragment
 * references `schema.yaml`, its JSON twin references `schema.json` — so a
 * toolchain never has to cross formats to resolve a pointer.
 *
 * @returns {(import('#fragments/fragments.layout').Fragment & {file: string, pointers: string[]})[]}
 */
export function writeFragments(normalized, into, formats = DEFAULT_FORMATS) {
  return layout(normalized).map(fragment => {
    const stem = resolve(into, ...fragment.path)
    const forFormat = format => targets(normalized, fragment, `${DOCUMENT}.${format}`)

    writeVariants(stem, format => wrapper(normalized.draft, forFormat(format)), formats)

    return { ...fragment, file: fragment.path.join('/'), pointers: forFormat(formats[ 0 ]) }
  })
}
