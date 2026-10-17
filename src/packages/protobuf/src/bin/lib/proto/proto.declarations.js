/**
 * What a parsed schema declares.
 *
 * Only the top level. A nested declaration is reachable only through its
 * parent, so it has no address of its own and travels inside its parent's
 * fragment — the same rule the sibling packages apply to inline objects.
 */

import protobuf from 'protobufjs'

/** @import { Enum, Namespace, Service, Type } from 'protobufjs' */

/**
 * @typedef {object} Declaration
 * @property {string}                name     the declared name, e.g. "FileDescriptorProto"
 * @property {string}                fullName package included, without the leading dot
 * @property {string}                kind     "message", "enum" or "service"
 * @property {Type | Enum | Service} node     the parsed declaration itself
 */

function kindOf(node) {
  if (node instanceof protobuf.Service) return 'service'

  return node instanceof protobuf.Type ? 'message' : 'enum'
}

/**
 * A parsed node, described the way the rest of the package addresses it.
 *
 * @returns {Declaration}
 */
function described(node) {
  return { name: node.name, fullName: node.fullName.replace(/^\./, ''), kind: kindOf(node), node }
}

/** @returns {Namespace} */
function namespace(root, packageName) {
  const found = root.lookup(packageName)

  if (!found) throw new Error(`no "${packageName}" package in the vendored schema`)

  return found
}

/**
 * Every addressable declaration, sorted by name.
 *
 * Messages and enums both qualify: either can be named from another file, and
 * a consumer looking one up should find a file rather than a gap. Services and
 * extensions are neither — the descriptor schema declares none.
 *
 * @returns {Declaration[]}
 */
export function declarations(root, packageName) {
  return namespace(root, packageName).nestedArray
    .filter(node => node instanceof protobuf.Type || node instanceof protobuf.Enum)
    .map(described)
    .sort((a, b) => a.name.localeCompare(b.name))
}

/** A node that ends the walk: something a `.proto` can name from another file. */
function isDeclaration(node) {
  return node instanceof protobuf.Type || node instanceof protobuf.Enum || node instanceof protobuf.Service
}

/** @param {Namespace} scope */
function* walk(scope) {
  for (const node of scope.nestedArray) {
    if (isDeclaration(node)) yield described(node)

    // a plain namespace is a package, and packages nest as deeply as they like
    else if (node instanceof protobuf.Namespace) yield* walk(node)
  }
}

/**
 * Every top-level declaration in a root, at whatever package depth, sorted by
 * full name.
 *
 * `declarations` asks the same question of a vendored release, where the
 * package is known and there is only one. A bundle carries as many packages as
 * it has files, so this descends through them and stops at the first
 * declaration on each branch. Services count here: a bundled schema is
 * somebody's API, and its services are the point of it.
 *
 * @returns {Declaration[]}
 */
export function topLevel(root) {
  return [ ...walk(root) ].sort((a, b) => a.fullName.localeCompare(b.fullName))
}

/** How many messages sit inside a declaration, at any depth. */
export function countNested(node) {
  const children = node.nestedArray?.filter(child => child instanceof protobuf.Type) ?? []

  return children.reduce((total, child) => total + 1 + countNested(child), 0)
}
