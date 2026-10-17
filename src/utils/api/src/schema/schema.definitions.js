/**
 * Normalizes documents whose object library is `definitions` — JSON Schema
 * draft-04 through draft-07. See schema.md.
 *
 * These drafts give a `$ref` no siblings — they are ignored outright — so
 * there is no composition case to guard against, and reference tolerance is
 * spelled as an inline `oneOf: [Reference, X]`.
 */

import { groups, isShaped, isUnionOfObjects, pointerTarget } from '#schema/schema.walk'

export const DRAFTS = [
  'http://json-schema.org/draft-07/schema#',
  'http://json-schema.org/draft-06/schema#',
  'http://json-schema.org/draft-04/schema#',
]

export const KEYWORD = 'definitions'

/**
 * The Reference Object, identified by the one thing only it requires.
 *
 * Not every specification has one — Swagger 2.0 predates the idea — so the
 * union handling below switches itself off when this finds nothing.
 */
function referenceDef(defs) {
  return Object.entries(defs).find(([ , def ]) => def?.required?.includes('$ref'))?.[ 0 ] ?? null
}

/**
 * The branch of a reference union carrying the actual object, or null when the
 * node is not one.
 *
 * OpenAPI 3.0 writes `oneOf: [Reference, Response]` wherever a `$ref` is
 * legal, which is the same idea 3.1+ spells as a `response-or-reference`.
 */
function unionTarget(node, reference) {
  const branches = node.oneOf ?? node.anyOf

  if (!Array.isArray(branches)) return null

  const targets = branches.map(branch => pointerTarget(branch?.$ref))

  if (targets.some(target => !target)) return null

  const content = targets.filter(target => target !== reference)

  return content.length === 1 ? content[ 0 ] : null
}

function reader(reference) {
  return node => pointerTarget(node.$ref) ?? unionTarget(node, reference)
}

/** Every object the document ever unions with a Reference. */
function referencable(document, reference) {
  const found = new Set()

  function walk(node) {
    if (!node || typeof node !== 'object') return

    const target = unionTarget(node, reference)

    if (target) found.add(target)

    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(walk)
      else walk(value)
    }
  }

  walk(document.properties)
  walk(document.definitions)

  return found
}

/**
 * Objects the document defines purely as a choice between other objects.
 *
 * MCP's `ClientRequest` is an `anyOf` over ten request types, and OpenAPI
 * 3.0's `SecurityScheme` a `oneOf` over four concrete forms. Either way the
 * union is the document naming a group, which is exactly what a directory is.
 */
function unionsIn(defs, exclude) {
  return Object.entries(defs)
    .filter(([ , def ]) => isUnionOfObjects(def))
    .map(([ key, def ]) => ({
      key,
      holds: (def.oneOf ?? def.anyOf)
        .map(branch => pointerTarget(branch.$ref))
        .filter(name => name !== exclude),
    }))
    .filter(union => union.holds.length > 1)
}

export function normalize(document, { componentsKey }) {
  const defs = document.definitions
  const reference = referenceDef(defs)
  const read = reader(reference)
  const unioned = reference ? referencable(document, reference) : new Set()

  const components = pointerTarget(document.properties?.[ componentsKey ]?.$ref)

  return {
    id: document.$id ?? document.id ?? '(no $id)',
    draft: document.$schema,
    pointer: name => `#/${KEYWORD}/${name}`,
    componentsKey,

    // these drafts predate dialect delegation — the schema object is real
    dialect: null,
    isDelegated: () => false,

    objects: Object.keys(defs)
      .filter(name => isShaped(defs[ name ]))
      .map(name => ({
        name,
        targets: unioned.has(name) ? [ reference, name ] : [ name ],
      })),

    unions: unionsIn(defs, reference),
    roots: groups(document.properties, read),
    components: groups(components ? defs[ components ]?.properties : null, read),
  }
}
