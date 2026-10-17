/**
 * Rendering the introspection SDL as an introspection result.
 *
 * SDL is GraphQL's first-class format, but the introspection *result* is how
 * every client-side tool consumes a schema, so a version is vendored as both.
 * See sdl.introspect.md.
 */

import { buildSchema, getIntrospectionQuery, graphqlSync, parse, print, visit } from 'graphql'

/** Reserved by the specification, and the reason for the detour below. */
const PREFIX = '__'

/** The entry point of the introspection system, and its own query root. */
const ROOT = '__Schema'

/**
 * The SDL under unreserved names, plus the mapping back.
 *
 * graphql-js answers introspection out of its own meta-types, which shadow
 * identically named definitions: build `type __Directive` verbatim and the
 * result describes the host's `__Directive`, silently, whatever the vendored
 * release says. Stripping the prefix keeps the two apart, and it goes back on
 * once the result is in hand.
 *
 * Only type names carry the prefix — fields are camelCase and enum values are
 * upper-case — so a blanket rename of prefixed names touches nothing else.
 */
function unreserved(sdl) {
  const names = new Map()

  const document = visit(parse(sdl), {
    Name: node => {
      if (!node.value.startsWith(PREFIX)) return undefined

      const stripped = node.value.slice(PREFIX.length)

      names.set(stripped, node.value)

      return { ...node, value: stripped }
    },
  })

  return { sdl: print(document), names }
}

/**
 * A schema needs a query root before it can be introspected, and the
 * introspection schema supplies its own: `__Schema` is the object a
 * `__schema` meta-field returns.
 */
function rooted(sdl, root) {
  return `${sdl}\n\nschema {\n  query: ${root}\n}\n`
}

/**
 * What the vendored release defines, less what the host added.
 *
 * A schema always reports the meta-types and built-in directives of whatever
 * implementation answered it. Those describe graphql-js, not Section 4, and
 * would drift with the dependency rather than with the release.
 */
function vendored(introspected) {
  return {
    ...introspected,
    types: introspected.types.filter(type => !type.name.startsWith(PREFIX)),
    directives: [],
  }
}

/** Asks a schema to describe itself, reporting a refusal as one error. */
function execute(schema) {
  const result = graphqlSync({ schema, source: getIntrospectionQuery() })

  if (result.errors) throw new Error(result.errors.map(error => error.message).join('\n'))

  return result.data.__schema
}

/** Restores the reserved names, wherever the result names a type. */
function restore(value, names) {
  if (Array.isArray(value)) return value.map(item => restore(item, names))

  if (!value || typeof value !== 'object') return value

  return Object.fromEntries(Object.entries(value).map(([ key, item ]) => [
    key,
    key === 'name' && names.has(item) ? names.get(item) : restore(item, names),
  ]))
}

/**
 * The introspection result for a release's SDL.
 *
 * Shaped as `{ __schema }` — what `buildClientSchema` reads — rather than a
 * whole GraphQL response, so a consumer never has to reach through `data`.
 *
 * @param   {string} sdl the introspection schema
 * @returns {object}     the introspection result
 */
export function introspect(sdl) {
  const { sdl: unprefixed, names } = unreserved(sdl)
  const root = ROOT.slice(PREFIX.length)

  if (!names.has(root)) throw new Error(`no ${ROOT} type — the SDL is not an introspection schema`)

  const schema = buildSchema(rooted(unprefixed, root))

  return { __schema: restore(vendored(execute(schema)), names) }
}

/**
 * The introspection result for an ordinary schema — what `bundle` writes when
 * asked for JSON.
 *
 * None of the detour above applies here. A bundled schema is someone's own,
 * so its names are not the reserved ones graphql-js owns, and the meta-types
 * and built-in directives a result carries are exactly what a client reading
 * it expects to find.
 *
 * @param   {string} sdl a complete schema
 * @returns {object}     the introspection result
 */
export function introspectSchema(sdl) {
  const schema = buildSchema(sdl)

  // a partial tree merges and prints fine; only introspection needs an entry point
  if (!schema.getQueryType()) {
    throw new Error('the schema declares no query root, so it cannot be introspected — write SDL instead')
  }

  return { __schema: execute(schema) }
}
