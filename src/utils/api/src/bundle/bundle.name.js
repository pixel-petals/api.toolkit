/**
 * Turning a document's own keys into file names.
 *
 * A key in a specification document is arbitrary text — an OpenAPI path is
 * `/pets/{petId}`, a channel address can hold dots and slashes — so it cannot
 * be a filename as written.
 *
 * Nothing has to reverse this. The parent document keeps the mapping in the
 * `$ref` it writes, so a slug only has to be stable, readable, and unique
 * within its directory.
 */

/** Characters no filesystem should be asked to carry. */
const UNSAFE = /[/\\:*?"<>|#%{}$@!'`^~[\]()+,;= ]+/g

export function slug(key) {
  const cleaned = key.replace(UNSAFE, '_').replace(/^_+|_+$/g, '')

  // a key of only unsafe characters still needs a name
  return cleaned || 'index'
}

/**
 * A slug that has not already been taken in this directory.
 *
 * `/pets` and `/pets/` slug identically, and a document is free to define
 * both, so collisions are resolved rather than silently overwritten.
 */
export function uniqueSlug(key, taken) {
  const base = slug(key)

  if (!taken.has(base)) {
    taken.add(base)
    return base
  }

  let n = 2

  while (taken.has(`${base}_${n}`)) n++

  taken.add(`${base}_${n}`)

  return `${base}_${n}`
}
