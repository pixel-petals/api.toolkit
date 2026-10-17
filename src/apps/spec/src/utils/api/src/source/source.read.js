/** Reading a vendored document back off disk. */

import { readFileSync } from 'node:fs'

import { SOURCE_FORMAT, parser } from '#serialize/serialize.format'
import { DOCUMENT, documentPath } from '#source/source.paths'

/** What to tell the user when nothing is vendored. */
const missing = (format, version, hint) =>
  new Error(`no ${DOCUMENT}.${format} for ${version}${hint ? ` — run \`${hint}\` first` : ''}`)

/**
 * Reads a vendored copy back as a plain object, through the same format
 * normalization the fetch used.
 *
 * Every vendored format holds the same document, so which one is read is a
 * free choice; JSON is the default because it is the copy every version is
 * guaranteed to have.
 *
 * @param {string} hint what to tell the user to run when nothing is vendored
 */
export function readDocument(root, version, hint, format = SOURCE_FORMAT) {
  try {
    return parser(format)(readFileSync(documentPath(root, version, format), 'utf8'))
  } catch (error) {
    if (error.code !== 'ENOENT') throw error

    throw missing(format, version, hint)
  }
}

/**
 * Reads a vendored source that is a language rather than an object encoding —
 * protobuf IDL, GraphQL SDL — where there is nothing to parse on the way in.
 */
export function readSource(root, version, format, hint) {
  try {
    return readFileSync(documentPath(root, version, format), 'utf8')
  } catch (error) {
    if (error.code !== 'ENOENT') throw error

    throw missing(format, version, hint)
  }
}
