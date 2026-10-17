/**
 * Asking a specification's registry what it publishes.
 *
 * A vendored tree only shows what was fetched, which says nothing about what
 * exists. This is the other half — so a gap between the two is visible rather
 * than assumed.
 */

import { SOURCE_FORMAT } from '#serialize/serialize.format'
import { versions } from '#source/source.paths'
import { readDocument } from '#source/source.read'

/**
 * What listing releases needs, which is much less than a whole descriptor —
 * a package with its own CLI can supply this and nothing else.
 *
 * @typedef {object} ReleaseSource
 * @property {string}   root           absolute path to the schema directory
 * @property {Function} releases       () => the releases upstream publishes
 * @property {Function} [releaseOf]    (document) => which release a vendored copy holds
 * @property {string}   [sourceFormat] the encoding a release is fetched as
 */

/**
 * @typedef {object} Release
 * @property {string} version the identifier `fetch` takes
 * @property {string} [date]  the release date, where one addresses a release
 * @property {string} [note]  anything worth saying about this one
 */

/** A version directory holds one release at a time; this is which one. */
function vendoredRelease(spec, version, format) {
  if (!spec.releaseOf) return null

  try {
    return spec.releaseOf(readDocument(spec.root, version, null, format))
  } catch {
    // an unreadable copy is still a vendored version, just an unidentifiable one
    return null
  }
}

/**
 * The releases upstream publishes, newest first, each marked against what is
 * on disk.
 *
 * A dated specification can publish many releases per version while a version
 * directory holds one, so `vendored` and `current` are separate answers: the
 * version is present, and this is the release it holds.
 *
 * @param {ReleaseSource} spec
 */
export async function releases(spec) {
  const format = spec.sourceFormat ?? SOURCE_FORMAT
  const published = await spec.releases()
  const vendored = new Set(versions(spec.root, format))

  const held = new Map([ ...vendored ].map(version => [ version, vendoredRelease(spec, version, format) ]))

  return published.map(release => ({
    ...release,
    vendored: vendored.has(release.version),
    // without a way to tell releases apart, do not claim a mismatch
    current: !spec.releaseOf || !release.date || held.get(release.version) === release.date,
  }))
}

/** `*` is on disk, `·` is a vendored version holding a different release. */
function marker(release) {
  if (!release.vendored) return ' '

  return release.current ? '*' : '·'
}

/** @param {ReleaseSource} spec */
export function releasesCommand(spec) {
  return async () => {
    const found = await releases(spec)

    if (!found.length) return console.log('the registry published nothing')

    const width = Math.max(...found.map(release => release.version.length))

    for (const release of found) {
      const detail = [ release.date, release.note ].filter(Boolean).join('  ')

      console.log(`${marker(release)} ${release.version.padEnd(width)}  ${detail}`)
    }

    const all = new Set(found.map(release => release.version))
    const have = new Set(found.filter(release => release.vendored).map(release => release.version))

    console.log('')
    console.log(`${have.size} of ${all.size} versions vendored, from ${found.length} published releases`)

    if (have.size < all.size) {
      console.log(`  missing: ${[ ...all ].filter(version => !have.has(version)).join(', ')}`)
    }
  }
}
