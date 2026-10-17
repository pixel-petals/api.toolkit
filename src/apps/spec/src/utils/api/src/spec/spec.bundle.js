/**
 * The `bundle` and `unbundle` commands.
 *
 * Unlike the rest of the CLI these take paths, not versions: they operate on
 * whatever document you point them at, which includes a vendored copy but is
 * mostly someone's own API description.
 */

import { basename, extname, resolve } from 'node:path'

import { DEFAULT_FORMATS, serializer } from '#serialize/serialize.format'
import { writeDocument } from '#serialize/serialize.write'
import { inline } from '#bundle/bundle.inline'
import { explode } from '#bundle/bundle.explode'
import { collectionKeys } from '#bundle/bundle.shape'

/** @import { SpecDescriptor } from '#spec/spec.descriptor' */

/** The formats to write, taken from the output path when it names one. */
function formatsFor(out, spec) {
  const extension = extname(out).slice(1)

  if (extension && serializerExists(extension)) return [ extension ]

  return spec.formats ?? DEFAULT_FORMATS
}

function serializerExists(format) {
  try {
    serializer(format)
    return true
  } catch {
    return false
  }
}

/** A path without its extension — what the writers take. */
function stemOf(out) {
  const extension = extname(out)

  return extension ? out.slice(0, -extension.length) : out
}

/**
 * `bundle <document> --out <file>`
 *
 * A specification with a bundler of its own supplies it as `spec.bundle`;
 * everything else gets the generic inliner.
 *
 * @param {SpecDescriptor} spec
 */
export function bundleCommand(spec) {
  return async (document, options) => {
    const source = resolve(document)
    const bundled = await (spec.bundle ? spec.bundle(source) : inline(source))

    const out = options.out ?? `${stemOf(source)}.bundled.json`
    const files = writeDocument(stemOf(resolve(out)), bundled, formatsFor(out, spec))

    console.log(`bundled ${basename(source)}`)

    for (const file of files) console.log(`  -> ${file}`)
  }
}

/**
 * `unbundle <document> --out <directory>`
 *
 * @param {SpecDescriptor} spec
 */
export function unbundleCommand(spec) {
  return async (document, options) => {
    const source = resolve(document)

    // bundle first, so a document that already points at other files becomes
    // one thing before it is taken apart again
    const whole = await inline(source)
    const into = resolve(options.out ?? `${stemOf(source)}.unbundled`)

    const { files, pieces } = explode(whole, into, {
      collections: collectionKeys(spec, whole),
      componentsKey: spec.componentsKey,
      stem: options.stem,
      formats: formatsFor(options.out ?? '', spec),
    })

    console.log(`unbundled ${basename(source)} into ${files.length} files (${pieces} pieces lifted out)`)
    console.log(`  -> ${into}`)
  }
}
