/**
 * Which of a document's top-level keys hold a map of named pieces.
 *
 * This is the difference between `paths`, whose keys are the author's, and
 * `info`, whose keys are the specification's. Exploding the first is what
 * unbundling means; exploding the second would scatter one object across
 * several files.
 *
 * The document alone cannot always say which is which — an `info` carrying
 * only `contact` and `license` looks exactly like a map of two objects. The
 * specification schema can, and it is already vendored, so it is asked first.
 */

import { SOURCE_FORMAT } from '#serialize/serialize.format'
import { readDocument } from '#source/source.read'

/** @import { SpecDescriptor } from '#spec/spec.descriptor' */

const POINTER = /^#\/(?:\$defs|definitions)\/(.+)$/

/**
 * Whether a schema node describes a map whose keys the author chooses.
 *
 * The map-ness is often a reference away — OpenAPI's root `paths` is a bare
 * `$ref`, and only the definition behind it carries the `patternProperties`
 * that make it a map — so a reference is followed rather than treated as
 * opaque. `seen` stops a recursive definition from looping.
 */
function isAuthorKeyed(node, defs, seen = new Set()) {
  if (!node || typeof node !== 'object') return false

  if (node.additionalProperties || node.patternProperties) return true

  const target = POINTER.exec(node.$ref ?? '')?.[ 1 ]

  if (!target || seen.has(target)) return false

  seen.add(target)

  return isAuthorKeyed(defs[ target ], defs, seen)
}

/**
 * Every value being an object is the best guess available without a schema.
 *
 * It is right for `paths` and `webhooks` and wrong for an `info` that happens
 * to hold only objects, which is why it is the fallback rather than the rule.
 */
function guess(document) {
  return new Set(Object.entries(document)
    .filter(([ , value ]) => value && typeof value === 'object' && !Array.isArray(value))
    .filter(([ , value ]) => Object.values(value).every(entry => entry && typeof entry === 'object'))
    .map(([ key ]) => key))
}

/**
 * The collection keys the vendored schema names, or a guess when the document
 * declares a version that is not vendored.
 *
 * @param   {SpecDescriptor} spec
 * @param   {object}         document
 * @returns {Set<string>}
 */
export function collectionKeys(spec, document) {
  const version = spec.versionOf?.(document)

  if (!version) return guess(document)

  try {
    const schema = readDocument(spec.root, version, null, spec.sourceFormat ?? SOURCE_FORMAT)
    const defs = schema.$defs ?? schema.definitions ?? {}

    return new Set(Object.entries(schema.properties ?? {})
      .filter(([ , node ]) => isAuthorKeyed(node, defs))
      .map(([ key ]) => key))
  } catch {
    // an unvendored version is a reason to guess, not to fail
    return guess(document)
  }
}
