/** Where a release of the GraphQL introspection schema comes from. */

import { tags } from '@util/api/source/source.github'
import { schemaRoot } from '@util/api/spec/spec.descriptor'

/** @import { SpecDescriptor } from '@util/api/spec/spec.descriptor' */

/** The prose the introspection type system is embedded in. */
const SECTION = 'Section 4 -- Introspection.md'

/**
 * The moving release. It is published beside the tagged ones at
 * spec.graphql.org, but it carries no tag and no date — it is whatever `main`
 * says today — so it keeps its own name.
 */
const DRAFT = 'draft'

const DRAFT_REF = 'main'

/**
 * Every tagged release, by the month it was published.
 *
 * Upstream names a release `October2021`, which neither sorts nor reads like a
 * version anywhere else in this repo. A date is the same fact in an order that
 * holds, so the identifier here is `2021-10` and the tag is derived from it.
 * Keeping the list dates is what stops an identifier and its tag drifting
 * apart, which a table of eight pairs would eventually let happen.
 */
const RELEASES = [ '2015-07', '2015-10', '2016-04', '2016-10', '2018-06', '2021-10', '2025-09' ]

const VERSIONS = [ ...RELEASES, DRAFT ]

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** The upstream tag for a release: the month spelled out, then the year. */
function tag(version) {
  const [ year, month ] = version.split('-')

  return `${MONTHS[ Number(month) - 1 ]}${year}`
}

/**
 * The specification moved its sections into `spec/` after the first release,
 * so 2015-07 alone keeps them at the repository root.
 */
const AT_ROOT = new Set([ '2015-07' ])

const REPOSITORY = 'graphql/graphql-spec'

/** The identifier for an upstream tag: the inverse of `tag()`. */
function versionOf(name) {
  const [ , month, year ] = /^([A-Za-z]+)(\d{4})$/.exec(name) ?? []
  const index = MONTHS.indexOf(month)

  if (index < 0) return null

  return `${year}-${String(index + 1).padStart(2, '0')}`
}

/**
 * Every release upstream publishes, newest first.
 *
 * The tags are read rather than reported from `RELEASES`, so a release
 * published after this file was written shows up as missing instead of being
 * invisible.
 */
async function releases() {
  const published = (await tags(REPOSITORY))
    .map(versionOf)
    .filter(Boolean)
    .sort((a, b) => b.localeCompare(a))
    .map(version => ({
      version,
      note: RELEASES.includes(version) ? '' : 'published upstream, not yet known to this package',
    }))

  return [ { version: DRAFT, note: `tracks ${DRAFT_REF}` }, ...published ]
}

/**
 * Rejects an identifier that names no release.
 *
 * Only the dated form is accepted. Taking the upstream spelling as well would
 * vendor the same release twice, under two directory names, the first time
 * anyone typed the other one.
 */
export function assertVersion(version) {
  if (VERSIONS.includes(version)) return

  throw new Error(`unknown version "${version}" — expected one of ${VERSIONS.join(', ')}`)
}

/**
 * The published HTML at spec.graphql.org is not a source: it carries the
 * introspection schema as rendered prose, so the Markdown behind it is what a
 * release is fetched from.
 */
function url(version) {
  const ref = version === DRAFT ? DRAFT_REF : tag(version)
  const directory = AT_ROOT.has(version) ? '' : 'spec/'

  return `https://raw.githubusercontent.com/graphql/graphql-spec/${ref}/${directory}${encodeURIComponent(SECTION)}`
}

/** @type {SpecDescriptor} */
export const graphql = {
  name: 'graphql',
  description: 'Vendor the GraphQL introspection schema and split it into per-type fragments',

  root: schemaRoot(import.meta.url),
  url,
  releases,

  // SDL is what is fetched; the introspection result beside it is derived
  sourceFormat: 'graphql',

  versionHint: '2025-09',
}
