/**
 * The three things every specification package does: vendor a document, split
 * it into fragments, and say what is vendored.
 *
 * Protobuf splits differently from its siblings — there is no JSON Schema to
 * normalize, so the parse *is* the normalization — but the commands, their
 * arguments and their output are the siblings'.
 */

import { writeDocument } from '@util/api/serialize/serialize.write'
import { documentStem, versions } from '@util/api/source/source.paths'
import { readSource } from '@util/api/source/source.read'

import { PACKAGE, protobuf } from '#lib/protobuf.spec'
import { reportFragments, reportVendored } from '#lib/protobuf.report'
import { countNested, declarations } from '#lib/proto/proto.declarations'
import { writeFragments } from '#lib/proto/proto.fragments'
import { parseIdl, toNamespace } from '#lib/proto/proto.parse'
import { IDL, fragmentsDir } from '#lib/source/source.paths'
import { vendorRelease } from '#lib/source/source.vendor'

/** The only command that touches the network. */
export async function fetchCommand(version) {
  const { url, files } = await vendorRelease(protobuf.root, version)

  reportVendored(url, files, protobuf.root)
}

/**
 * Reads the vendored IDL and derives everything else from it: the whole schema
 * as JSON, and one fragment per top-level declaration.
 *
 * Both are generated here rather than at fetch time so that `split` alone
 * regenerates them, and a fetched tree holds nothing but what was downloaded.
 */
export function splitCommand(version, options) {
  const root = parseIdl(readSource(protobuf.root, version, IDL, `${protobuf.name} fetch ${version}`))
  const found = declarations(root, PACKAGE)

  writeDocument(documentStem(protobuf.root, version), toNamespace(root), [ 'json' ])

  const written = writeFragments(found, fragmentsDir(protobuf.root, version))

  if (!options?.quiet) reportFragments(written, protobuf.root)

  const messages = found.filter(declaration => declaration.kind === 'message')
  const nested = found.reduce((total, declaration) => total + countNested(declaration.node), 0)

  console.log('')
  console.log(`wrote schema.json and ${written.length} fragments to ${version}/ (${PACKAGE})`)
  console.log(`  ${messages.length} messages and ${found.length - messages.length} enums at the top level, ${nested} messages nested inside them`)
}

export function listCommand() {
  const found = versions(protobuf.root, IDL)

  if (!found.length) return console.log(`nothing vendored yet — run \`${protobuf.name} fetch <version>\``)

  for (const version of found) console.log(`  ${version}`)
}
