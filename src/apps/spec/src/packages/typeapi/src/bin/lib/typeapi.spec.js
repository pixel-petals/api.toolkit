/** Where the TypeAPI specification lives. */

import { fetchDocument } from '@util/api/source/source.fetch'
import { schemaRoot } from '@util/api/spec/spec.descriptor'

/** TypeHub is where TypeAPI's versions are registered, though not served. */
const TAGS = 'https://api.typehub.cloud/document/typehub/typeapi/tag'

/**
 * The versions TypeHub registers, newest first.
 *
 * Every one of them reports the same note: TypeHub records that a version
 * exists but exposes no way to fetch it, so only whatever the default branch
 * currently holds can actually be vendored.
 */
async function releases() {
  const { entry = [] } = await fetchDocument(TAGS)

  return entry.map(tag => ({
    version: tag.version,
    date: String(tag.insertDate).slice(0, 10),
    note: 'registered only — TypeHub serves no document export',
  }))
}

/**
 * TypeAPI publishes no per-version URL.
 *
 * Its repository carries no tags or releases, and TypeHub — where its versions
 * (0.1.0, 0.1.1) are actually registered — exposes no public export endpoint.
 * So a fetch reads the default branch and the version names what that branch
 * currently is, rather than addressing a release.
 */
export const typeapi = {
  name: 'typeapi',
  description: 'Vendor the TypeAPI specification and split it into TypeSchema documents',

  root: schemaRoot(import.meta.url),

  url: () => 'https://raw.githubusercontent.com/apioo/typeapi/main/specification/typeapi.json',
  baseUrl: 'https://raw.githubusercontent.com/apioo/typeschema/master/specification/typeschema.json',

  releases,

  versionHint: '0.1.1',
}
