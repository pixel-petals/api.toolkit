/**
 * TypeAPI's commands.
 *
 * The shared `spec.cli` runs a JSON Schema pipeline, which TypeAPI is not, so
 * the command names and output match the sibling packages while the work
 * underneath differs.
 */

import { readFileSync } from 'node:fs'
import { basename, resolve } from 'node:path'

import { DEFAULT_FORMATS, parser } from '@util/api/serialize/serialize.format'
import { writeDocument } from '@util/api/serialize/serialize.write'
import { fetchDocument, vendorDocument } from '@util/api/source/source.fetch'
import { readDocument } from '@util/api/source/source.read'
import { versionDir, versions } from '@util/api/source/source.paths'
import { reportVendored } from '@util/api/spec/spec.report'

import { typeapi } from '#lib/typeapi.spec'
import { baseOf, bundle, vendoredImports } from '#lib/typeschema/typeschema.bundle'
import { writeFragments } from '#lib/typeschema/typeschema.split'

/** The alias the specification imports its base document under. */
const IMPORTS = 'imports'

export async function fetchCommand(version) {
  const { url, files } = await vendorDocument({
    root: typeapi.root,
    version,
    url: typeapi.url(),
    formats: DEFAULT_FORMATS,
  })

  // the specification is a TypeSchema document that inherits from TypeSchema
  // itself; without its base beside it, `typeschema:` targets reach nothing
  const base = await fetchDocument(typeapi.baseUrl)
  const baseFiles = writeDocument(
    resolve(versionDir(typeapi.root, version), IMPORTS, 'typeschema'),
    base,
    DEFAULT_FORMATS,
  )

  reportVendored(url, files, typeapi.root)
  reportVendored(typeapi.baseUrl, baseFiles, typeapi.root)
}

export function splitCommand(version, options) {
  const document = readDocument(typeapi.root, version, `typeapi fetch ${version}`)
  const written = writeFragments(document, versionDir(typeapi.root, version))

  if (!options?.quiet) {
    const width = Math.max(...written.map(fragment => fragment.file.length))

    for (const fragment of written) {
      console.log(`  ${fragment.file.padEnd(width)}  ${fragment.def} (+${fragment.carries - 1} carried)`)
    }
  }

  const homed = written.filter(fragment => fragment.homed).length

  console.log('')
  console.log(`wrote ${written.length} fragments to ${version}/ (root: ${document.root})`)
  console.log(`  ${homed} placed by the document's shape, ${written.length - homed} under fragments/`)
}

export function listCommand() {
  const found = versions(typeapi.root)

  if (!found.length) return console.log('nothing vendored yet — run `typeapi fetch <version>`')

  for (const version of found) console.log(`  ${version}`)
}

/**
 * `bundle <document> --out <file>`
 *
 * Folds imported documents in, so the result stands alone. The vendored copy
 * has its base beside it under `imports/`, which is what makes the
 * specification itself bundleable offline.
 */
export async function bundleCommand(document, options) {
  const source = resolve(document)
  const parsed = parser('json')(readFileSync(source, 'utf8'))
  const from = baseOf(source)

  const bundled = await bundle(parsed, { from, imports: vendoredImports(parsed, from) })

  const out = options.out ?? source.replace(/\.json$/, '.bundled')
  const files = writeDocument(out.replace(/\.(json|yaml)$/, ''), bundled, DEFAULT_FORMATS)

  console.log(`bundled ${basename(source)} — ${Object.keys(bundled.definitions).length} definitions`)

  for (const file of files) console.log(`  -> ${file}`)
}

/**
 * `unbundle <document> --out <directory>`
 *
 * The same extraction `split` performs on a vendored version, pointed at any
 * document instead.
 */
export function unbundleCommand(document, options) {
  const source = resolve(document)
  const parsed = parser('json')(readFileSync(source, 'utf8'))
  const into = resolve(options.out ?? source.replace(/\.(json|yaml)$/, '.unbundled'))

  const written = writeFragments(parsed, into)

  console.log(`unbundled ${basename(source)} into ${written.length} documents`)
  console.log(`  -> ${into}`)
}
