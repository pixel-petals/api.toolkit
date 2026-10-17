/**
 * What protobuf publishes, and where a release lives.
 *
 * Protobuf has no schema registry and no published JSON Schema — the schema is
 * a source file in the compiler's own repository, addressed by release tag.
 */

import { tags } from '@util/api/source/source.github'
import { schemaRoot } from '@util/api/spec/spec.descriptor'

import { IDL } from '#lib/source/source.paths'

/** The repository both the release list and every source file come from. */
const REPOSITORY = 'protocolbuffers/protobuf'

/**
 * The self-describing schema.
 *
 * Every `.proto` a compiler reads becomes a `FileDescriptorProto`, so this one
 * file is the data model of the entire language — protobuf's equivalent of the
 * OpenAPI schema document.
 */
export const SCHEMA = 'descriptor.proto'

/**
 * Vendored alongside the schema, under `defs/`.
 *
 * `type.proto` is the runtime reflection schema — the same information as a
 * descriptor, shaped for a server that answers questions about its own types.
 * The rest are the well-known types: the small library of messages every
 * protobuf toolchain ships and every schema is free to import.
 */
export const DEFS_FILES = [
  'type.proto',

  'any.proto',
  'api.proto',
  'duration.proto',
  'empty.proto',
  'field_mask.proto',
  'source_context.proto',
  'struct.proto',
  'timestamp.proto',
  'wrappers.proto',
]

/** Every vendored file declares this package; it is where the declarations live. */
export const PACKAGE = 'google.protobuf'

/**
 * Releases are git tags — `v36.1`, `v32.0`. A version that starts with a digit
 * is that tag without its `v`; anything else is taken as a git ref verbatim, so
 * `main` vendors a schema change that has not been tagged yet.
 */
function ref(version) {
  return /^\d/.test(version) ? `v${version}` : version
}

export function sourceUrl(version, file) {
  return `https://raw.githubusercontent.com/${REPOSITORY}/${ref(version)}/src/google/protobuf/${file}`
}

/**
 * Every release tag the repository carries, newest first.
 *
 * Only `vMAJOR.MINOR` tags are releases; the repository also carries release
 * candidates and language-specific tags that publish no descriptor.
 */
async function releases() {
  const found = await tags(REPOSITORY)

  return found
    .filter(tag => /^v\d+\.\d+$/.test(tag))
    .map(tag => ({ version: tag.slice(1) }))
}

export const protobuf = {
  name: 'protobuf',
  description: 'Vendor the protobuf descriptor schema and split it into per-declaration fragments',

  root: schemaRoot(import.meta.url),
  releases,

  // a release is vendored the moment its IDL is on disk; the JSON is derived
  sourceFormat: IDL,

  versionHint: '36.1',
}
