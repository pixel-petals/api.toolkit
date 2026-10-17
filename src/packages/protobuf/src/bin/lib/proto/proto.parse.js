/**
 * Protobuf IDL, in and out of JSON.
 *
 * `protobufjs` is the reference JavaScript implementation of the language, so
 * the parse is the compiler's reading of the file rather than a guess at it.
 */

import protobuf from 'protobufjs'

/** @import { Root } from 'protobufjs' */

/**
 * `keepCase` leaves field names as the IDL spells them — `json_name`, not
 * `jsonName` — so the JSON is a rendering of the document rather than a rename
 * of it. `alternateCommentMode` reads the `//` doc comments the schema is
 * mostly made of; without it they are dropped on the floor.
 *
 * Shared with the multi-file load so a bundle and a `split` read the same
 * document out of the same bytes.
 */
export const PARSE_OPTIONS = { keepCase: true, alternateCommentMode: true }

/** @returns {Root} */
export function parseIdl(source) {
  return protobuf.parse(source, PARSE_OPTIONS).root
}

/**
 * The namespace tree `protobuf.Root.fromJSON` reads back, comments included.
 *
 * @returns {object}
 */
export function toNamespace(root) {
  return root.toJSON({ keepComments: true })
}
