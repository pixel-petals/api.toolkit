/**
 * The GitHub endpoints a schema registry is reached through.
 *
 * Four of the specifications publish their releases as repository tags or
 * directory listings rather than through a registry of their own, so this is
 * where "what versions exist" comes from for them.
 */

const API = 'https://api.github.com/repos'

/**
 * GitHub rejects an unidentified client, so every request names one.
 *
 * @param   {string}       path
 * @returns {Promise<any>}      the parsed JSON body, typed by the caller
 */
async function api(path) {
  const response = await fetch(`${API}/${path}`, { headers: { 'User-Agent': 'pixelpetals-api-spec' } })

  if (!response.ok) throw new Error(`${response.status} ${response.statusText} — ${path}`)

  return response.json()
}

/** GitHub caps a page at 100; anything past that needs asking for. */
const PAGE = 100

/**
 * Every release tag, newest first as GitHub returns them.
 *
 * Paged to exhaustion rather than taking the first hundred. A long-lived
 * repository carries far more than that — protobuf has 467 — and stopping at
 * one page silently reports an old release as the oldest that exists.
 *
 * @returns {Promise<string[]>}
 */
export async function tags(repo, { limit = 1000 } = {}) {
  const found = []

  for (let page = 1; found.length < limit; page++) {
    /** @type {{name: string}[]} */
    const batch = await api(`${repo}/tags?per_page=${PAGE}&page=${page}`)

    found.push(...batch.map(tag => tag.name))

    if (batch.length < PAGE) break
  }

  return found
}

/**
 * The entries of one directory, filtered to directories or to files.
 *
 * @param   {string}                  repo
 * @param   {string}                  path
 * @param   {{type?: 'dir' | 'file'}} [options]
 * @returns {Promise<string[]>}
 */
export async function contents(repo, path, { type } = {}) {
  /** @type {{name: string, type: string}[]} */
  const entries = await api(`${repo}/contents/${path}`)

  return entries.filter(entry => !type || entry.type === type).map(entry => entry.name)
}
