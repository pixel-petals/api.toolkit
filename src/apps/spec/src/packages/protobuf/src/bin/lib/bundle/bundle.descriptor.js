/**
 * An entry `.proto` and everything it imports, resolved into one descriptor.
 *
 * The bundle is JSON, not a merged `.proto`, and that is a decision rather
 * than a shortcut — see readme.md. `import` *is* protobuf's bundling
 * mechanism, so concatenating the files it names would change type resolution
 * rather than preserve it. The descriptor is the compiler's finished reading
 * of the whole import graph, which is what a merged `.proto` was reaching for.
 */

import { existsSync } from 'node:fs'
import { basename, dirname, resolve } from 'node:path'

import protobuf from 'protobufjs'

import { PARSE_OPTIONS, toNamespace } from '#lib/proto/proto.parse'

/**
 * @typedef {object} Bundle
 * @property {object}   descriptor the namespace tree, self-contained
 * @property {string[]} files      every file that went into it
 */

/**
 * Reads an `import` the way `protoc` does, as closely as this can.
 *
 * An import names a path under an include root, not a path relative to the
 * file that writes it: `sub/beta.proto` importing `sub/gamma.proto` means the
 * same file both times. protobufjs resolves against the importing file
 * instead, looks for `sub/sub/gamma.proto` and fails, so the entry's own
 * directory stands in for the include root. The library's resolution stays as
 * the fallback, for a tree that really does import by relative path.
 */
function useIncludeRoot(root, from) {
  const relativeToOrigin = root.resolvePath.bind(root)

  root.resolvePath = (origin, target) => {
    const candidate = resolve(from, target)

    return existsSync(candidate) ? candidate : relativeToOrigin(origin, target)
  }
}

/**
 * Fails loudly on a descriptor that still names a type it does not carry.
 *
 * `loadSync` resolves the live root, but the promise being made is about the
 * JSON: whatever reads the file gets it through `Root.fromJSON`, so that is
 * the path worth checking before the file is written.
 */
function assertSelfContained(descriptor, entry) {
  try {
    protobuf.Root.fromJSON(descriptor).resolveAll()
  } catch (error) {
    throw new Error(`${entry} did not bundle into a self-contained descriptor: ${error.message}`)
  }
}

/**
 * The whole import graph, as one namespace tree.
 *
 * The well-known types are the one thing not read off disk: protobufjs carries
 * its own copies and answers `google/protobuf/*.proto` from them, so a schema
 * importing `timestamp.proto` bundles without an include root pointing at a
 * protobuf checkout.
 *
 * @param   {string} entry absolute path to the entry `.proto`
 * @returns {Bundle}
 */
export function bundleDescriptor(entry) {
  const root = new protobuf.Root()

  useIncludeRoot(root, dirname(entry))
  root.loadSync(entry, PARSE_OPTIONS)

  const descriptor = toNamespace(root)

  assertSelfContained(descriptor, basename(entry))

  return { descriptor, files: [ ...root.files ] }
}
