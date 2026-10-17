/** What the shared specification tooling needs to know about mcp. */

import { contents } from '@util/api/source/source.github'
import { schemaRoot } from '@util/api/spec/spec.descriptor'

const REPOSITORY = 'modelcontextprotocol/modelcontextprotocol'

/** Every dated schema directory the repository carries, newest first. */
async function releases() {
  const dirs = await contents(REPOSITORY, 'schema', { type: 'dir' })

  return dirs
    .sort((a, b) => b.localeCompare(a))
    .map(version => ({ version, note: version === 'draft' ? 'tracks main' : '' }))
}

/** @import { SpecDescriptor } from '@util/api/spec/spec.descriptor' */

/**
 * MCP versions *are* dates, so a release needs no second argument.
 *
 * The dialect changes mid-history: releases up to 2025-06-18 are draft-07 with
 * `definitions`, and 2025-11-25 onward are 2020-12 with `$defs`. Both are read
 * without configuration here — the normalizer picks its rules off the
 * document's own `$schema`.
 */
function url(version) {
  return `https://raw.githubusercontent.com/modelcontextprotocol/modelcontextprotocol/main/schema/${version}/schema.json`
}

/** @type {SpecDescriptor} */
export const mcp = {
  name: 'mcp',
  description: 'Vendor the Model Context Protocol schema and split it into $ref-able fragments',

  root: schemaRoot(import.meta.url),
  url,
  releases,

  versionHint: '2026-07-28',
}
