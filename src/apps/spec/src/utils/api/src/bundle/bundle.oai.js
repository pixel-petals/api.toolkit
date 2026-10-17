/**
 * Bundling an OpenAPI Initiative document — OpenAPI or Arazzo — with Redocly.
 *
 * The generic inliner is correct but flat: it replaces every external
 * reference with the thing it names, so a schema used in five places is
 * copied five times.
 *
 * Redocly knows the shape it is working on. It lifts each referenced file into
 * the reusable-object map and leaves an internal reference behind, which is
 * how these documents are written by hand, and it keeps the result stable
 * across a round trip — a file at `components/schemas/Pet.yaml` goes back to
 * `components.schemas.Pet` rather than to a generated name.
 */

import { bundle as redocly, createConfig } from '@redocly/openapi-core'

/**
 * @param   {string}          file the root document
 * @returns {Promise<object>}
 */
export async function bundleOai(file) {
  const config = await createConfig({})
  const result = await redocly({ ref: file, config })

  return result.bundle.parsed
}
