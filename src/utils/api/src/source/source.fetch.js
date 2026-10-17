/** Fetching a specification document and vendoring it. */

import { SOURCE_FORMAT, parser } from '#serialize/serialize.format'
import { documentStem } from '#source/source.paths'
import { writeDocument } from '#serialize/serialize.write'

async function request(url) {
  const response = await fetch(url)

  if (!response.ok) throw new Error(`${response.status} ${response.statusText} — ${url}`)

  return response
}

/**
 * Downloads a document and normalizes it into a plain object.
 *
 * The encoding is named rather than assumed — this is the normalize step for
 * formats, the mirror of what `serializer` does on the way out — so a
 * specification that publishes YAML needs no new code path.
 */
export async function fetchDocument(url, format = SOURCE_FORMAT) {
  return parser(format)(await (await request(url)).text())
}

/**
 * For sources that are a language rather than an object encoding — protobuf
 * IDL, GraphQL SDL — where the response is the artefact.
 */
export async function fetchText(url) {
  return (await request(url)).text()
}

/**
 * Downloads a document and writes it into `<root>/<version>/schema.<format>`.
 *
 * `sourceFormat` is the encoding upstream publishes; `formats` are the ones we
 * republish it as. They are independent — the document is normalized once on
 * arrival, so a YAML toolchain never has to convert on the way in.
 *
 * @returns {Promise<{document: unknown, url: string, files: string[]}>}
 */
export async function vendorDocument({ root, version, url, formats, sourceFormat = SOURCE_FORMAT }) {
  const document = await fetchDocument(url, sourceFormat)
  const files = writeDocument(documentStem(root, version), document, formats)

  return { document, url, files }
}
