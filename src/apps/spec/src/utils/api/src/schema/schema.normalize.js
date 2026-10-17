/**
 * Turns a fetched schema document into the shape the fragment layer works on:
 * external source -> normalize -> process.
 *
 * Nothing downstream knows which JSON Schema draft or specification version it
 * is looking at. See schema.md for the contract.
 */

import * as defs from '#schema/schema.defs'
import * as definitions from '#schema/schema.definitions'

const NORMALIZERS = [ defs, definitions ]

/** Drafts spell the trailing `#` inconsistently; the identity does not change. */
function sameDraft(declared, known) {
  return String(declared).replace(/#$/, '') === known.replace(/#$/, '')
}

function normalizerFor(document) {
  return NORMALIZERS.find(candidate =>
    candidate.DRAFTS.some(draft => sameDraft(document.$schema, draft)) && document[ candidate.KEYWORD ])
}

/**
 * @param {object} document                the fetched schema
 * @param {object} [options]
 * @param {string} [options.componentsKey] root key naming the reusable-object map
 */
export function normalizeDocument(document, { componentsKey = 'components' } = {}) {
  const normalizer = normalizerFor(document)

  if (!normalizer) {
    const keyword = NORMALIZERS.map(candidate => candidate.KEYWORD).find(key => document[ key ])

    throw new Error(keyword
      ? `unsupported draft "${document.$schema}" for a ${keyword} document`
      : `unrecognised schema document — $schema is ${document.$schema ?? '(absent)'}, with no $defs or definitions`)
  }

  return normalizer.normalize(document, { componentsKey })
}
