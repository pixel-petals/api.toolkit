/**
 * Merging SDL files into one document.
 *
 * Concatenation is the whole of the merge: a schema split across files *is*
 * its files concatenated, and joining the text rather than reprinting an AST
 * is what carries every comment through untouched.
 *
 * What this adds is the two things concatenation alone would let past — a
 * name defined twice, which silently keeps one definition, and a document
 * that no longer builds.
 */

import { buildSchema } from 'graphql'

import { isExtension, splitDefinitions } from '#lib/sdl/sdl.types'

/** @import { SdlDefinition } from '#lib/sdl/sdl.types' */
/** @import { SdlSource } from '#lib/bundle/bundle.sources' */

/** @typedef {SdlDefinition & {file: string}} SourcedDefinition */

/**
 * The two kinds that are not types.
 *
 * graphql-js publishes these as `Kind`, which TypeScript will not let a
 * checked `.js` file import, so the two this file needs are spelled out.
 */
const DIRECTIVE = 'DirectiveDefinition'

const SCHEMA = 'SchemaDefinition'

/**
 * What one file declares, with a syntax error named for the file it is in.
 *
 * Parsing per file rather than once over the merged text is what makes both
 * this message and the duplicate below able to say *where*.
 *
 * @param   {SdlSource}           source
 * @returns {SourcedDefinition[]}
 */
function declared(source) {
  try {
    return splitDefinitions(source.sdl).map(definition => ({ ...definition, file: source.file }))
  } catch (error) {
    throw new Error(`${source.file} — ${error.message}`)
  }
}

/**
 * What two definitions have to share to be a redefinition, or null when the
 * definition cannot be one.
 *
 * Types, directives and the schema block are three namespaces: a `Skip` type
 * and a `@skip` directive never collide. Extensions are excluded outright —
 * several `extend type Foo` blocks are how a schema is meant to be assembled,
 * and merging them is the point.
 *
 * @param {SourcedDefinition} definition
 */
function identity(definition) {
  if (isExtension(definition.kind)) return null

  if (definition.kind === DIRECTIVE) return `directive @${definition.name}`

  if (definition.kind === SCHEMA) return 'the schema definition'

  return `type ${definition.name}`
}

/**
 * Rejects a name the merged document would hold twice.
 *
 * graphql-js catches this too, but only by name — the files are the useful
 * half of the answer, and by then they are gone.
 *
 * @param {SourcedDefinition[]} definitions
 */
function assertUnique(definitions) {
  const seen = new Map()

  for (const definition of definitions) {
    const id = identity(definition)

    if (!id) continue

    if (seen.has(id)) throw new Error(`${id} is defined twice — ${seen.get(id)} and ${definition.file}`)

    seen.set(id, definition.file)
  }
}

/**
 * Rejects a merge that is not a schema.
 *
 * A tree missing one of its files still concatenates; it just references a
 * type nothing defines. Building here is what turns that into a message
 * instead of a `.graphql` nobody can load.
 */
function assertBuildable(sdl) {
  try {
    buildSchema(sdl)
  } catch (error) {
    throw new Error(`the merged schema does not build —\n${error.message}`)
  }
}

/**
 * Files holding only extensions, moved after the rest.
 *
 * A type has to be defined before it is extended. Sorted by name alone,
 * `query.extension.graphql` comes before `query.graphql` and the schema
 * arrives in an order nobody wrote. graphql-js merges a whole document at
 * once and does not mind, but a pipeline walking definitions in order would
 * see something different, and the output should say what the author said.
 *
 * A file mixing both stays with the definitions: separating them would mean
 * reprinting its text, which is what loses the comments.
 *
 * @param {SdlSource[]} sources
 */
function byKind(sources) {
  const extensions = []
  const definitions = []

  for (const source of sources) {
    const declarations = declared(source)
    const extendsOnly = declarations.length > 0 && declarations.every(one => isExtension(one.kind))

    if (extendsOnly) extensions.push(source)
    else definitions.push(source)
  }

  return [ ...definitions, ...extensions ]
}

/**
 * One document from many: definitions in file order, then extensions.
 *
 * @param   {SdlSource[]}                        sources
 * @returns {{sdl: string, definitions: number}}
 */
export function merge(sources) {
  const ordered = byKind(sources)
  const definitions = ordered.flatMap(declared)

  assertUnique(definitions)

  const bodies = ordered.map(source => source.sdl.trim()).filter(Boolean)
  const sdl = `${bodies.join('\n\n')}\n`

  assertBuildable(sdl)

  return { sdl, definitions: definitions.length }
}
