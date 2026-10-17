/**
 * The `bundle` and `unbundle` commands.
 *
 * Unlike the rest of the CLI these take paths, not versions: they operate on
 * whatever schema you point them at, which includes a vendored copy but is
 * mostly someone's own.
 *
 * They are the sibling packages' commands in shape and in output, and share
 * none of their code — there is no `$ref` to resolve, so bundling is a merge
 * of definitions and unbundling is a split of them. See readme.md.
 */

import { basename, extname, resolve } from 'node:path'

import { writeText } from '@util/api/serialize/serialize.text'
import { writeDocument } from '@util/api/serialize/serialize.write'

import { explode } from '#lib/bundle/bundle.explode'
import { merge } from '#lib/bundle/bundle.merge'
import { readSources } from '#lib/bundle/bundle.sources'
import { INTROSPECTION, SDL } from '#lib/sdl/sdl.files'
import { introspectSchema } from '#lib/sdl/sdl.introspect'

/** A path without its extension — what the writers take. */
function stemOf(path) {
  const extension = extname(path)

  return extension ? path.slice(0, -extension.length) : path
}

/**
 * The format to write, taken from the output path.
 *
 * SDL unless the output is named `.json`, because SDL is what went in and an
 * introspection result is a second thing to ask for rather than the default
 * answer.
 */
function formatOf(out) {
  return extname(out).slice(1) === INTROSPECTION ? INTROSPECTION : SDL
}

/** A count that reads right in a summary line. */
function count(total, noun) {
  return `${total} ${noun}${total === 1 ? '' : 's'}`
}

/**
 * `bundle <source> --out <file>`
 *
 * @param {string} source        a file, or a directory of them
 * @param {object} options
 * @param {string} [options.out] where to write it
 */
export function bundleCommand(source, options) {
  const from = resolve(source)
  const sources = readSources(from)
  const { sdl, definitions } = merge(sources)

  const out = resolve(options.out ?? `${stemOf(from)}.bundled.${SDL}`)
  const stem = stemOf(out)

  const files = formatOf(out) === INTROSPECTION
    ? writeDocument(stem, introspectSchema(sdl), [ INTROSPECTION ])
    : [ writeText(stem, sdl, SDL) ]

  console.log(`bundled ${basename(from)} — ${count(definitions, 'definition')} from ${count(sources.length, 'file')}`)

  for (const file of files) console.log(`  -> ${file}`)
}

/**
 * `unbundle <source> --out <directory>`
 *
 * The source is merged before it is taken apart, so a schema that is already
 * a tree becomes one document first and is split on the same rules a single
 * file would be.
 *
 * @param {string} source        a file, or a directory of them
 * @param {object} options
 * @param {string} [options.out] where to write the tree
 */
export function unbundleCommand(source, options) {
  const from = resolve(source)
  const { sdl } = merge(readSources(from))

  const into = resolve(options.out ?? `${stemOf(from)}.unbundled`)
  const written = explode(sdl, into)

  console.log(`unbundled ${basename(from)} into ${count(written.length, 'file')}`)
  console.log(`  -> ${into}`)
}
