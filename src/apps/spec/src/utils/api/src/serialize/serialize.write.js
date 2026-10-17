/** Writing a document to disk in one or more formats. */

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

import { DEFAULT_FORMATS, serializer } from '#serialize/serialize.format'

/**
 * Writes `value` as `<stem>.<format>` once per format.
 *
 * The stem carries no extension — the formats decide it — so one call keeps
 * every representation of a document in step by construction.
 *
 * @param   {string}   stem    absolute path without an extension
 * @param   {unknown}  value   the document to render
 * @param   {string[]} formats format names, defaulting to JSON and YAML
 * @returns {string[]}         the files written
 */
export function writeDocument(stem, value, formats = DEFAULT_FORMATS) {
  mkdirSync(dirname(stem), { recursive: true })

  return formats.map(format => {
    const file = `${stem}.${format}`

    writeFileSync(file, serializer(format)(value), 'utf8')

    return file
  })
}
