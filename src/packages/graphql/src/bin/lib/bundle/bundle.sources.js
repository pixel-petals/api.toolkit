/**
 * Collecting the SDL a bundle is made of.
 *
 * GraphQL has no `$ref`, so no file says which others belong with it — the
 * directory is the only statement of that, and reading it is the whole of
 * reference resolution here. Files are taken in code-point order — not
 * `localeCompare`, whose collation reorders punctuation and put
 * `query.extension_2` ahead of `query.extension` — so the same
 * tree bundles to the same document every time.
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { resolve } from 'node:path'

import { SDL } from '#lib/sdl/sdl.files'

/**
 * @typedef {object} SdlSource
 * @property {string} file absolute path to the file
 * @property {string} sdl  what it holds
 */

/** Every SDL file under a directory, depth first, siblings in name order. */
function walk(directory) {
  const entries = readdirSync(directory, { withFileTypes: true })
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))

  return entries.flatMap(entry => {
    const path = resolve(directory, entry.name)

    if (entry.isDirectory()) return walk(path)

    return entry.name.endsWith(`.${SDL}`) ? [ path ] : []
  })
}

/**
 * The files to merge, from a directory or from one document.
 *
 * A file named directly is read whatever it is called — pointing at
 * `schema.gql` says which file you mean — while a directory is filtered,
 * because an unbundled tree carries `.json` beside the SDL as often as not.
 *
 * @param   {string}      path
 * @returns {SdlSource[]}
 */
export function readSources(path) {
  if (!existsSync(path)) throw new Error(`no such file or directory — ${path}`)

  const files = statSync(path).isDirectory() ? walk(path) : [ path ]

  if (!files.length) throw new Error(`no .${SDL} files under ${path}`)

  return files.map(file => ({ file, sdl: readFileSync(file, 'utf8') }))
}
