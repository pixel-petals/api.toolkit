/**
 * The three things every specification package does: vendor a document, split
 * it into fragments, and say what is vendored.
 *
 * All of it is driven by a descriptor, so a package contributes where its
 * schemas live and how to build a release URL, and nothing else.
 */

import { DEFAULT_FORMATS } from '#serialize/serialize.format'
import { writeFragments } from '#fragments/fragments.write'
import { normalizeDocument } from '#schema/schema.normalize'
import { vendorDocument } from '#source/source.fetch'
import { readDocument } from '#source/source.read'
import { versionDir, versions } from '#source/source.paths'
import { reportFragments, reportVendored } from '#spec/spec.report'

/** @import { SpecDescriptor } from '#spec/spec.descriptor' */

/** @param {SpecDescriptor} spec */
export function fetchCommand(spec) {
  return async (version, date) => {
    const { url, files } = await vendorDocument({
      root: spec.root,
      version,
      url: spec.url(version, date),
      formats: spec.formats ?? DEFAULT_FORMATS,
      sourceFormat: spec.sourceFormat,
    })

    reportVendored(url, files, spec.root)
  }
}

/** @param {SpecDescriptor} spec */
export function splitCommand(spec) {
  return (version, options) => {
    const document = readDocument(spec.root, version, `${spec.name} fetch ${version}`, spec.sourceFormat)
    const normalized = normalizeDocument(document, { componentsKey: spec.componentsKey })
    const written = writeFragments(normalized, versionDir(spec.root, version), spec.formats ?? DEFAULT_FORMATS)

    if (!options?.quiet) reportFragments(written)

    const homed = written.filter(fragment => fragment.homed).length

    console.log('')
    console.log(`wrote ${written.length} fragments to ${version}/ (${normalized.id})`)
    console.log(`  ${homed} placed by the document's shape, ${written.length - homed} under fragments/`)
  }
}

/** @param {SpecDescriptor} spec */
export function listCommand(spec) {
  return () => {
    const found = versions(spec.root)

    if (!found.length) return console.log(`nothing vendored yet — run \`${spec.name} fetch <version>\``)

    for (const version of found) console.log(`  ${version}`)
  }
}
