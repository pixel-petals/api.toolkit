/**
 * Writing formats that are already text.
 *
 * GraphQL SDL and Protobuf IDL are source languages, not object encodings —
 * there is nothing to serialize, only a file to place. They still go through
 * the same stem-plus-extension convention as JSON and YAML so a caller treats
 * every format the same way.
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

/** Every file ends with exactly one newline, whatever the source did. */
function terminated(text) {
  return text.endsWith('\n') ? text : `${text}\n`
}

/**
 * @param   {string} stem   absolute path without an extension
 * @param   {string} text   the content, written verbatim
 * @param   {string} format the extension, e.g. "graphql" or "proto"
 * @returns {string}        the file written
 */
export function writeText(stem, text, format) {
  const file = `${stem}.${format}`

  mkdirSync(dirname(stem), { recursive: true })
  writeFileSync(file, terminated(text), 'utf8')

  return file
}
