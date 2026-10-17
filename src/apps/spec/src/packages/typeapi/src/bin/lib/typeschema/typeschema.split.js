/**
 * Writes one TypeSchema document per definition.
 *
 * Unlike a JSON Schema fragment, which is a pointer, each of these is a whole
 * valid TypeSchema document: it carries the definition, everything that
 * definition transitively needs, and a `root` naming it. TypeSchema imports
 * whole documents by alias and has no syntax for reaching a single definition
 * in another file, so a pointer would have nothing to say.
 */

import { resolve } from 'node:path'

import { DEFAULT_FORMATS } from '@util/api/serialize/serialize.format'
import { writeDocument } from '@util/api/serialize/serialize.write'

import { layout } from '#lib/typeschema/typeschema.layout'
import { closure } from '#lib/typeschema/typeschema.refs'

/** Keeps the source document's key order, so diffs stay readable. */
function pick(definitions, names) {
  return Object.fromEntries(Object.keys(definitions)
    .filter(name => names.has(name))
    .map(name => [ name, definitions[ name ] ]))
}

/**
 * The imports a fragment still needs.
 *
 * Only aliases the extract actually mentions are carried over — an unused
 * import would make a fragment claim a dependency it does not have.
 */
function importsFor(document, definitions) {
  const used = JSON.stringify(definitions)
  const entries = Object.entries(document.import ?? {})
    .filter(([ alias ]) => used.includes(`"${alias}:`))

  return entries.length ? { import: Object.fromEntries(entries) } : {}
}

export function writeFragments(document, into, formats = DEFAULT_FORMATS) {
  const { definitions, root } = document

  return layout(definitions, root).map(fragment => {
    const extracted = pick(definitions, closure(definitions, fragment.def))

    const contents = {
      ...importsFor(document, extracted),
      definitions: extracted,
      root: fragment.def,
    }

    writeDocument(resolve(into, ...fragment.path), contents, formats)

    return { ...fragment, file: fragment.path.join('/'), carries: Object.keys(extracted).length }
  })
}
