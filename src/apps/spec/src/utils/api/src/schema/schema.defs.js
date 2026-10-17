/**
 * Normalizes documents whose object library is `$defs` — JSON Schema 2019-09
 * and 2020-12. See schema.md.
 *
 * These drafts let a `$ref` carry siblings, so a reference beside `properties`
 * is composition rather than containment, and reference tolerance is spelled
 * as a named `-or-reference` object.
 */

import { groups, isShaped, isUnionOfObjects, pointerTarget } from '#schema/schema.walk'

const VARIANT_SUFFIX = '-or-reference'

export const DRAFTS = [
  'https://json-schema.org/draft/2020-12/schema',
  'https://json-schema.org/draft/2019-09/schema',
]

export const KEYWORD = '$defs'

/** The object carrying the `$dynamicAnchor` a `$dynamicRef` resolves to. */
function anchored(defs) {
  return Object.entries(defs).find(([ , def ]) => def?.$dynamicAnchor)?.[ 0 ] ?? null
}

/**
 * The object a name refers to, with the variant spelling stripped.
 *
 * A document points at `response-or-reference` where a `$ref` is legal, but
 * the object living there is a Response either way. Downstream names objects,
 * not spellings, so the distinction is resolved here and survives only in the
 * pointer a fragment ends up carrying.
 */
function baseName(name) {
  return name.endsWith(VARIANT_SUFFIX) ? name.slice(0, -VARIANT_SUFFIX.length) : name
}

/**
 * Reads one containment position.
 *
 * A `$ref` sitting alongside `properties` is in-place composition — the way
 * an OpenAPI object pulls in specification-extensions — and names no child, so
 * only a leaf `$ref` counts.
 */
function reader(defs) {
  const hook = anchored(defs)

  return node => {
    const isLeaf = !node.properties && !node.additionalProperties && !node.patternProperties
    const target = pointerTarget(node.$ref)

    if (target && isLeaf) return baseName(target)

    // a $dynamicRef in a container position is always the schema-object hook
    return node.$dynamicRef ? hook : null
  }
}

/**
 * The objects a fragment points at, preferring the `-or-reference` variant.
 *
 * The plain objects set `unevaluatedProperties: false`, which rejects a
 * fragment file that is itself a bare {"$ref": "./other.json"} — routine in a
 * bundle. The variant branches on that and is otherwise identical. Which
 * objects have one moves between versions, so it is read rather than listed.
 */
function targetsFor(defs, name) {
  const variant = `${name}${VARIANT_SUFFIX}`

  return defs[ variant ] ? [ variant ] : [ name ]
}

/**
 * Objects the document defines purely as a choice between other objects.
 *
 * MCP's `ClientRequest` is an `anyOf` over ten request types, and OpenAPI
 * 3.0's `SecurityScheme` a `oneOf` over four concrete forms. Either way the
 * union is the document naming a group, which is exactly what a directory is.
 */
function unionsIn(defs) {
  return Object.entries(defs)
    .filter(([ , def ]) => isUnionOfObjects(def))
    .map(([ key, def ]) => ({
      key,
      holds: (def.oneOf ?? def.anyOf)
        .map(branch => baseName(pointerTarget(branch.$ref))),
    }))
    .filter(union => union.holds.length > 1)
}

export function normalize(document, { componentsKey }) {
  const defs = document.$defs
  const read = reader(defs)

  const components = pointerTarget(document.properties?.[ componentsKey ]?.$ref)

  return {
    id: document.$id ?? '(no $id)',
    draft: document.$schema,
    pointer: name => `#/${KEYWORD}/${name}`,
    componentsKey,

    // some versions let a document choose its own dialect, leaving the schema
    // object an empty stub that a fragment must bypass
    dialect: document.properties?.jsonSchemaDialect?.default ?? null,
    isDelegated: name => Boolean(defs[ name ]?.$dynamicAnchor),

    objects: Object.keys(defs)
      .filter(name => !name.endsWith(VARIANT_SUFFIX) && isShaped(defs[ name ]))
      .map(name => ({ name, targets: targetsFor(defs, name) })),

    unions: unionsIn(defs),
    roots: groups(document.properties, read),
    components: groups(components ? defs[ components ]?.properties : null, read),
  }
}
