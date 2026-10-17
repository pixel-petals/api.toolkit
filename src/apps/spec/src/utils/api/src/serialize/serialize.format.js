/**
 * The object encodings a document can arrive in and be written as.
 *
 * A format is two-way: `parse` normalizes an encoding into a plain object on
 * the way in, `render` turns one back into text on the way out. Callers name a
 * format and never an encoder, so adding one is a single entry here.
 *
 * Languages are not formats in this sense — GraphQL SDL and protobuf IDL carry
 * no object to normalize into, and live in serialize.text.js.
 */

import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'

/** Two-space indent, trailing newline — the shape a formatter would leave. */
function renderJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`
}

/**
 * `lineWidth: 0` disables folding.
 *
 * The default wraps long scalars across lines, which mangles the URLs that
 * make up most of a pointer document — legal YAML, unreadable diffs.
 */
function renderYaml(value) {
  return stringifyYaml(value, { lineWidth: 0 })
}

/** @type {Record<string, {parse: Function, render: Function}>} */
export const FORMATS = {
  json: { parse: JSON.parse, render: renderJson },
  yaml: { parse: parseYaml, render: renderYaml },
}

export const DEFAULT_FORMATS = [ 'json', 'yaml' ]

/** The format every specification we vendor publishes its source as. */
export const SOURCE_FORMAT = 'json'

/** Rejects an unknown format by name rather than writing an empty file. */
function formatFor(format) {
  const known = FORMATS[ format ]

  if (!known) throw new Error(`unknown format "${format}" — expected one of ${Object.keys(FORMATS).join(', ')}`)

  return known
}

/** Text -> a plain object. The normalize step, on the way in. */
export function parser(format) {
  return formatFor(format).parse
}

/** A plain object -> text. The same step, on the way out. */
export function serializer(format) {
  return formatFor(format).render
}
