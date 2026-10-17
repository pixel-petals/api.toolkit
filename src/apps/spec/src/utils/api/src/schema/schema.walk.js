/**
 * Traversal shared by every normalizer.
 *
 * A containment position is one where a document nests another object: an
 * array's items, a map's values, or a property's own value. Reading a single
 * position is where the drafts differ, so that is passed in.
 */

const POINTER = /^#\/(?:\$defs|definitions)\/(.+)$/

/** The object name a local pointer names, or null if it points elsewhere. */
export function pointerTarget(ref) {
  return typeof ref === 'string' ? POINTER.exec(ref)?.[ 1 ] ?? null : null
}

/**
 * The objects a node contains, as opposed to composes.
 *
 * @param {object}   node
 * @param {Function} read the draft's rule for reading one position
 */
export function contained(node, read, found = []) {
  if (!node || typeof node !== 'object') return found

  const direct = read(node)

  if (direct) {
    found.push(direct)
    return found
  }

  if (node.items) contained(node.items, read, found)
  if (node.additionalProperties) contained(node.additionalProperties, read, found)

  for (const value of Object.values(node.patternProperties ?? {})) contained(value, read, found)
  for (const value of Object.values(node.properties ?? {})) contained(value, read, found)

  return found
}

/** A key holding many named children becomes a directory; one object, a file. */
export function isCollection(node) {
  return node.type === 'array' || Boolean(node.additionalProperties) || Boolean(node.patternProperties)
}

/** Every key of a properties map that holds at least one object. */
export function groups(properties, read) {
  return Object.entries(properties ?? {})
    .map(([ key, node ]) => ({ key, collection: isCollection(node), holds: contained(node, read) }))
    .filter(group => group.holds.length)
}

/**
 * A choice between named objects is itself an object — OpenAPI 3.0 defines
 * `SecurityScheme` as a `oneOf` over its four concrete forms.
 *
 * Requiring every branch to be a local pointer is what separates it from a
 * constraint like `SchemaXORContent`, whose branches are bare `required`
 * clauses that shape nothing on their own.
 */
export function isUnionOfObjects(def) {
  const branches = def.oneOf ?? def.anyOf

  return Array.isArray(branches) && branches.length > 0
    && branches.every(branch => pointerTarget(branch?.$ref))
}

/**
 * An object can stand alone in a file only if it describes a shape. The rest
 * only add constraints to whatever composes them, so a file containing one
 * would validate nothing.
 */
export function isShaped(def) {
  return Boolean(def) && (
    def.type !== undefined
    || def.additionalProperties !== undefined
    || def.items !== undefined
    || def.$dynamicAnchor !== undefined
    || isUnionOfObjects(def)
  )
}
