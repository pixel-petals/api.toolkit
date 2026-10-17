/**
 * Bundling: a tree of files linked by `$ref` becomes one document.
 *
 * The generic case, for any `$ref`-following specification. Packages whose
 * specification has a bundler of its own — OpenAPI and Arazzo have Redocly's,
 * which lifts pieces into `components` rather than inlining them — use that
 * instead, because idiomatic output beats a correct-but-flat one.
 */

import $RefParser from '@apidevtools/json-schema-ref-parser'

/**
 * Inlines every external reference, leaving internal ones alone.
 *
 * `bundle` rather than `dereference`: an internal `$ref` is how a document
 * says two places share one definition, and resolving those would both inflate
 * the output and turn a cycle into an infinite one.
 *
 * @param   {string}          file the root document
 * @returns {Promise<object>}
 */
export function inline(file) {
  return $RefParser.bundle(file)
}

/**
 * Inlines everything, including internal references.
 *
 * Only safe on an acyclic document, which is why it is not the default — a
 * self-referential schema has no finite dereferenced form.
 *
 * @param   {string}          file
 * @returns {Promise<object>}
 */
export function flatten(file) {
  return $RefParser.dereference(file)
}
