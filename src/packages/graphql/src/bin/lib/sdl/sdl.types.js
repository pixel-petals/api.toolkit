/** Splitting a GraphQL document into one definition per piece. */

import { TokenKind, isTypeDefinitionNode, parse } from 'graphql'

/** What a `schema { … }` block is called, since it declares no name of its own. */
const SCHEMA = 'schema'

/**
 * @typedef {object} SdlDefinition
 * @property {string} name the definition's name, e.g. "__Schema"
 * @property {string} kind the AST node kind, e.g. "ObjectTypeDefinition"
 * @property {string} sdl  the definition alone, verbatim
 */

/**
 * A definition that declares a type — what `split` writes fragments for.
 *
 * @typedef {SdlDefinition} SdlType
 */

/** Every extension kind is named for the thing it extends, plus the suffix. */
export function isExtension(kind) {
  return kind.endsWith('Extension')
}

/** A definition's name, or the name for the one block that has none. */
function nameOf(definition) {
  return 'name' in definition ? definition.name.value : SCHEMA
}

/**
 * Whether `comment` is the definition's own, rather than the previous one's.
 *
 * Two things disqualify it: a blank line between the two, which is how a
 * reader separates a note from what follows it, and sharing a line with the
 * code before it, which makes it a trailing comment on that code.
 */
function isAttached(comment, token) {
  if (comment?.kind !== TokenKind.COMMENT) return false

  return comment.line === token.line - 1 && comment.prev?.line !== comment.line
}

/**
 * Where the definition starts once its own comment block is counted in.
 *
 * A comment above a definition sits outside the node's span, so cutting at
 * `loc.start` would leave it behind. The parser keeps comment tokens in the
 * token chain even though it parses nothing from them, so they are walked
 * back over rather than searched for in the text.
 */
function leading(definition) {
  let token = definition.loc.startToken

  while (isAttached(token.prev, token)) token = token.prev

  return token.start
}

/**
 * The definition as it was written.
 *
 * `print` would round-trip the node instead, and drop every comment on the
 * way — and the comments in Section 4 carry the constraints the SDL cannot
 * state, such as which fields are non-null for which kind. Cutting at the
 * node's own boundaries keeps them without ever guessing where a type ends.
 */
function source(sdl, definition) {
  return sdl.slice(leading(definition), definition.loc.end)
}

/** @returns {SdlDefinition[]} */
function cut(sdl, nodes) {
  return nodes.map(node => ({
    name: nameOf(node),
    kind: node.kind,
    sdl: `${source(sdl, node)}\n`,
  }))
}

/**
 * Every type the document declares, in source order.
 *
 * The definitions come off the AST rather than out of the text, so a fragment
 * is a definition the parser agreed to — not a span between two braces that
 * happened to look like one.
 *
 * @returns {SdlType[]}
 */
export function splitTypes(sdl) {
  return cut(sdl, parse(sdl).definitions.filter(isTypeDefinitionNode))
}

/**
 * Every top-level definition, in source order.
 *
 * The superset `splitTypes` filters: directive definitions, the schema block,
 * and the extensions of either. A vendored introspection schema contains only
 * types, but a schema someone unbundles is under no such constraint, and a
 * definition dropped here would be a definition lost.
 *
 * @returns {SdlDefinition[]}
 */
export function splitDefinitions(sdl) {
  return cut(sdl, parse(sdl).definitions)
}
