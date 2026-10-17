/**
 * The `bundle` and `unbundle` commands.
 *
 * Unlike the rest of the CLI these take paths, not versions: they operate on
 * whatever you point them at, which includes a vendored copy but is mostly
 * someone's own schema.
 */

import { readFileSync } from 'node:fs'
import { basename, extname, resolve } from 'node:path'

import { parser } from '@util/api/serialize/serialize.format'
import { writeDocument } from '@util/api/serialize/serialize.write'

import { bundleDescriptor } from '#lib/bundle/bundle.descriptor'
import { explodeDescriptor } from '#lib/bundle/bundle.tree'
import { reportBundled, reportUnbundled } from '#lib/protobuf.report'
import { IDL } from '#lib/source/source.paths'

/** The one output encoding: protobuf has no YAML reader, and no merged IDL. */
const FORMAT = 'json'

/** A path without its extension — what the writers take. */
function stemOf(path) {
  const extension = extname(path)

  return extension ? path.slice(0, -extension.length) : path
}

/**
 * `bundle <entry.proto> --out <file.json>`
 *
 * The output is a JSON descriptor rather than a merged `.proto`, which is a
 * decision the readme argues rather than a limitation of the tool.
 */
export function bundleCommand(entry, options) {
  const source = resolve(entry)
  const { descriptor, files } = bundleDescriptor(source)

  const out = options.out ?? `${stemOf(source)}.bundled.${FORMAT}`
  const [ written ] = writeDocument(stemOf(resolve(out)), descriptor, [ FORMAT ])

  reportBundled(basename(source), files, written)
}

/**
 * Both inputs the command accepts: a bundled descriptor, or the `.proto` it
 * would have come from.
 *
 * The siblings bundle before they explode, so a document that points at other
 * files becomes one thing before it is taken apart again. An entry `.proto` is
 * that same situation — its imports are its references.
 */
function descriptorOf(source) {
  if (extname(source) === `.${IDL}`) return bundleDescriptor(source).descriptor

  return parser(FORMAT)(readFileSync(source, 'utf8'))
}

/** `unbundle <descriptor.json> --out <directory>` */
export function unbundleCommand(document, options) {
  const source = resolve(document)
  const into = resolve(options.out ?? `${stemOf(source)}.unbundled`)

  const { files, pieces } = explodeDescriptor(descriptorOf(source), into, {
    source: basename(source),
    stem: options.stem,
  })

  reportUnbundled(basename(source), files, pieces, into)
}
