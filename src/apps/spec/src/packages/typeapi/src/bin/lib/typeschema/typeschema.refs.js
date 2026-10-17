/**
 * Reading references out of a TypeSchema document.
 *
 * TypeSchema is not JSON Schema. It has no `$ref` and no JSON pointers — a
 * reference is a typed node, `{type: "reference", target: "Name"}`, and a
 * cross-namespace one qualifies the target with an import alias,
 * `"typeschema:PropertyType"`. See typeschema.md.
 */

/** A qualified target belongs to an imported document, not this one. */
function isLocal(target) {
  return typeof target === 'string' && !target.includes(':')
}

/** The definition a node refers to, or null if it refers to nothing local. */
export function referenceTarget(node) {
  if (!node || typeof node !== 'object') return null

  if (node.type === 'reference') return isLocal(node.target) ? node.target : null

  // a map or array carries its element type in `schema`
  return node.schema ? referenceTarget(node.schema) : null
}

/** A map or array holds many named children; a plain reference holds one. */
export function isCollection(node) {
  return node?.type === 'map' || node?.type === 'array'
}

/**
 * Every definition a node reaches, following properties, element types, the
 * struct parent, and discriminator mappings.
 */
export function referencesIn(node, found = new Set()) {
  if (!node || typeof node !== 'object') return found

  const target = referenceTarget(node)

  if (target) found.add(target)

  for (const value of Object.values(node.properties ?? {})) referencesIn(value, found)
  for (const name of Object.values(node.mapping ?? {})) found.add(name)

  if (node.parent) referencesIn(node.parent, found)
  if (node.schema) referencesIn(node.schema, found)

  return found
}

/**
 * A definition and everything it transitively needs.
 *
 * TypeSchema has no way for one document to reference a definition in another
 * file — only whole documents are imported, by alias. So a fragment cannot be
 * a pointer the way a JSON Schema one is; it has to carry its own closure to
 * be a valid document at all.
 */
export function closure(definitions, name, collected = new Set()) {
  if (collected.has(name) || !definitions[ name ]) return collected

  collected.add(name)

  for (const reference of referencesIn(definitions[ name ])) closure(definitions, reference, collected)

  return collected
}
