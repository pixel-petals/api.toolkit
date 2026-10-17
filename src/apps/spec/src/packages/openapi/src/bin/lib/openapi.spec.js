/** What the shared specification tooling needs to know about OpenAPI. */

import { bundleOai } from '@util/api/bundle/bundle.oai'
import { oaiReleases } from '@util/api/source/source.registry'
import { schemaRoot } from '@util/api/spec/spec.descriptor'

/** @import { SpecDescriptor } from '@util/api/spec/spec.descriptor' */

/**
 * OpenAPI publishes four resources per version — `meta`, `dialect`, `schema`
 * and `schema-base` — each addressed by a release date. Only `schema` is
 * vendored: a 3.1+ document states its own dialect in
 * `jsonSchemaDialect.default`, and earlier versions have no dialect at all, so
 * the other requests buy nothing.
 */
function url(version, date) {
  return `https://spec.openapis.org/oas/${version}/schema/${date}`
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
  return document.openapi?.split('.').slice(0, 2).join('.') ?? null
}

/** @type {SpecDescriptor} */
export const openapi = {
  name: 'openapi',
  description: 'Vendor the OpenAPI schema and split it into $ref-able fragments',

  root: schemaRoot(import.meta.url),
  versionOf,
  bundle: bundleOai,
  url,
  releases: () => oaiReleases('oas'),
  releaseOf,

  dated: true,
  versionHint: '3.2',
  dateHint: '2025-11-23',
}
