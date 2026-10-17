/** What the shared specification tooling needs to know about asyncapi. */

import { contents } from '@util/api/source/source.github'
import { schemaRoot } from '@util/api/spec/spec.descriptor'

/** @import { SpecDescriptor } from '@util/api/spec/spec.descriptor' */

const REPOSITORY = 'asyncapi/spec-json-schemas'

/**
 * AsyncAPI publishes each version twice, and this is the suffix of the half
 * worth vendoring.
 *
 * Its twin stamps an `$id` on every definition, which turns all 434 internal
 * references into absolute `http://asyncapi.com/...` URLs and leaves nothing a
 * local pointer can resolve. The `asyncapi.com/definitions/<version>.json` URL
 * the repository README recommends serves that same `$id` variant, so both the
 * release listing and the fetch read the schema repository instead.
 */
const VARIANT = '-without-$id.json'

function url(version) {
  return `https://raw.githubusercontent.com/${REPOSITORY}/master/schemas/${version}${VARIANT}`
}

/** Every version the schema repository carries, newest first. */
async function releases() {
  const files = await contents(REPOSITORY, 'schemas', { type: 'file' })

  return files
    .filter(name => name.endsWith(VARIANT))
    .map(name => ({ version: name.slice(0, -VARIANT.length) }))
    .sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }))
}

/**
 * The vendored version a document declares, which is how unbundling learns
 * which of its top-level keys hold collections.
 */
function versionOf(document) {
  return document.asyncapi ?? null
}

/** @type {SpecDescriptor} */
export const asyncapi = {
  name: 'asyncapi',
  description: 'Vendor the AsyncAPI schema and split it into $ref-able fragments',

  root: schemaRoot(import.meta.url),
  versionOf,
  url,
  releases,

  versionHint: '3.1.0',
}
