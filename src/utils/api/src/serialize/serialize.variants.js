/** Writing a document whose content differs per format. */

import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

import { DEFAULT_FORMATS } from '#serialize/serialize.format'
import { writeDocument } from '#serialize/serialize.write'

/**
 * Writes `<stem>.<format>` once per format, building each from `build`.
 *
 * A pointer document is the case this exists for: a YAML fragment has to
 * reference `schema.yaml` where its JSON twin references `schema.json`, so the
 * content is not the same document rendered twice.
 *
 * @param   {string}   stem    absolute path without an extension
 * @param   {Function} build   (format) => the document for that format
 * @param   {string[]} formats format names, defaulting to JSON and YAML
 * @returns {string[]}         the files written
 */
export function writeVariants(stem, build, formats = DEFAULT_FORMATS) {
  mkdirSync(dirname(stem), { recursive: true })

  return formats.flatMap(format => writeDocument(stem, build(format), [ format ]))
}
