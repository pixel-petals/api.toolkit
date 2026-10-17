/**
 * Naming the file a definition is unbundled into.
 *
 * The name a definition carries is not unique on its own. `type Colour` and
 * `directive @colour` are two namespaces the filesystem does not have, and a
 * schema may extend one type as many times as it likes.
 *
 * Nothing has to reverse this. Bundling reads whatever SDL a directory holds,
 * under any name, so a stem only has to be stable, readable and unique.
 */

import { isExtension } from '#lib/sdl/sdl.types'
import { fileStem } from '#lib/sdl/sdl.name'

/**
 * An extension is not the type it extends, so it does not get that type's
 * file. The suffix says which it is where a reader will look — in the name.
 */
const EXTENSION = 'extension'

/**
 * A name not already taken in this directory.
 *
 * `utils/bundle/bundle.name` does this for the `$ref` specifications, and is
 * deliberately not reused: it slugs first, and its slug strips leading
 * underscores. That is right for a document key and wrong here, where `__` is
 * the specification's own prefix and `__Schema` must not land on `schema`.
 * A GraphQL name is letters, digits and underscores, so there is nothing to
 * slug in the first place.
 */
function unique(name, taken) {
  let stem = name
  let n = 1

  while (taken.has(stem)) stem = `${name}_${++n}`

  taken.add(stem)

  return stem
}

/**
 * A file name for the definition, unique among the ones already taken.
 *
 * @param {object} definition
 * @param {string} definition.name
 * @param {string} definition.kind
 * @param {Set}    taken           the stems already used in this directory
 */
export function stemFor(definition, taken) {
  const base = fileStem(definition.name)
  const name = isExtension(definition.kind) ? `${base}.${EXTENSION}` : base

  return unique(name, taken)
}
