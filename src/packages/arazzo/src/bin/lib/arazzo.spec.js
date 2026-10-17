/** What the shared specification tooling needs to know about arazzo. */

import { bundleOai } from '@util/api/bundle/bundle.oai'
import { oaiReleases } from '@util/api/source/source.registry'
import { schemaRoot } from '@util/api/spec/spec.descriptor'

/** @import { SpecDescriptor } from '@util/api/spec/spec.descriptor' */

/**
 * Arazzo publishes one resource per version, addressed by release date, the
 * same way OpenAPI does. There is no `schema-base` variant and no `latest`
 * alias — every release is spelled out.
 *
 * Releases are keyed by URL rather than by `$id`: the 1.0 2024-12-16 document
 * identifies itself as `.../2024-08-01`, a URL that does not resolve.
 */
function url(version, date) {
  return `https://spec.openapis.org/arazzo/${version}/schema/${date}`
}

/**
 * The release a vendored copy holds, read from its own `$id`.
 *
 * Arazzo 1.0's 2024-12-16 document is the known exception — it identifies
 * itself as `.../2024-08-01`, a URL that does not resolve — so that copy
 * reports a release the registry never lists, and shows as an unrecognised
 * one rather than being silently mislabelled.
 */
function releaseOf(document) {
  // draft-04 documents spell it `id`; 2.0 carries no date in either
  return (document.$id ?? document.id)?.match(/(\d{4}-\d{2}-\d{2})$/)?.[ 1 ] ?? null
}

/**
 * The vendored version a document declares, which is how unbundling learns
 * which of its top-level keys hold collections.
 */
function versionOf(document) {
  return document.arazzo?.split('.').slice(0, 2).join('.') ?? null
}

/** @type {SpecDescriptor} */
export const arazzo = {
  name: 'arazzo',
  description: 'Vendor the Arazzo workflow schema and split it into $ref-able fragments',

  root: schemaRoot(import.meta.url),
  versionOf,
  bundle: bundleOai,
  url,
  releases: () => oaiReleases('arazzo'),
  releaseOf,

  dated: true,
  versionHint: '1.1',
  dateHint: '2026-04-15',
}
