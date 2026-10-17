/**
 * One JSON file per top-level declaration.
 *
 * There are no `.proto` fragments, and there cannot be. A message is not a
 * compilation unit: it inherits its file's `syntax`, `package` and `option`
 * headers, and names its neighbours by bare identifier. Cut one out and the
 * result either fails to compile or — worse — compiles into a different type
 * in a different package. See readme.md.
 *
 * The parsed JSON has no such problem. It is a description of a declaration,
 * not a translation unit, so a single declaration extracted from it is exactly
 * as true as the whole.
 */

import { resolve } from 'node:path'

import { camel } from '@util/api/fragments/fragments.name'
import { writeDocument } from '@util/api/serialize/serialize.write'
import { DOCUMENT } from '@util/api/source/source.paths'

/** @import { Declaration } from '#lib/proto/proto.declarations' */

/** Fragments sit two levels below the version root, under defs/fragments/. */
const UP = '../../'

/**
 * Where the same node sits in `schema.json`.
 *
 * A fragment stands alone, so this is a cross-reference rather than the
 * content — but it is what lets a reader check a fragment against the document
 * it came from, which is the job the siblings' `$ref` does.
 */
function pointer(fullName) {
  const path = fullName.split('.').map(segment => `nested/${segment}`).join('/')

  return `${UP}${DOCUMENT}.json#/${path}`
}

/**
 * A declaration's own JSON, plus enough identity to read it on its own.
 *
 * `keepComments` carries the schema's documentation across; those comments are
 * the only prose describing what each field means, and dropping them would
 * make the fragments unreadable next to the IDL.
 */
function fragment(declaration) {
  return {
    name: declaration.name,
    fullName: declaration.fullName,
    kind: declaration.kind,

    pointer: pointer(declaration.fullName),
    descriptor: declaration.node.toJSON({ keepComments: true }),
  }
}

/**
 * Writes every fragment, overwriting freely — nothing in them is hand-written,
 * and refusing to overwrite would only make version bumps annoying.
 *
 * @param   {Declaration[]}                                found
 * @param   {string}                                       into  the fragments directory
 * @returns {{name: string, kind: string, file: string}[]}
 */
export function writeFragments(found, into) {
  return found.map(declaration => {
    const [ file ] = writeDocument(resolve(into, camel(declaration.name)), fragment(declaration), [ 'json' ])

    return { name: declaration.name, kind: declaration.kind, file }
  })
}
