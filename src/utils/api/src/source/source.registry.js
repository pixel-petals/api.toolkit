/** Reading the OpenAPI Initiative's registry pages. */

import { fetchText } from '#source/source.fetch'

/**
 * A dated schema link, as every OAI specification publishes them:
 * `/oas/3.2/schema/2025-11-23`. The `.html` sibling is the rendered page, not
 * the schema, so it is excluded.
 */
const RELEASE = /\/(\d+\.\d+)\/schema\/(\d{4}-\d{2}-\d{2})(?!\.html)/g

/**
 * Every dated release an OAI registry index links, newest first.
 *
 * The index is HTML — there is no machine-readable listing — but the links
 * themselves are the data, and their shape is fixed by the URL scheme every
 * OAI specification publishes under.
 *
 * A version appears once per release, because each is separately fetchable:
 * `openapi fetch 3.1 2022-10-07` is as valid as the newest one.
 */
export async function oaiReleases(specification) {
  const page = await fetchText(`https://spec.openapis.org/${specification}/`)

  const seen = new Set()
  const found = []

  for (const [ , version, date ] of page.matchAll(RELEASE)) {
    const key = `${version}@${date}`

    if (seen.has(key)) continue

    seen.add(key)
    found.push({ version, date })
  }

  return found.sort((a, b) =>
    b.version.localeCompare(a.version, undefined, { numeric: true }) || b.date.localeCompare(a.date))
}
