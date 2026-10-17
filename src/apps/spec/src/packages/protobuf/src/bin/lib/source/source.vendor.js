/**
 * Placing a downloaded release in the schema tree.
 *
 * Every file is written verbatim, under its upstream basename. A `.proto`
 * names itself in the `import` statements of every file that uses it, so
 * renaming one — to camelCase, the way a fragment file is named — would break
 * the imports it exists to satisfy.
 */

import { basename, resolve } from 'node:path'

import { writeText } from '@util/api/serialize/serialize.text'
import { fetchText } from '@util/api/source/source.fetch'
import { documentStem } from '@util/api/source/source.paths'

import { DEFS_FILES, SCHEMA, sourceUrl } from '#lib/protobuf.spec'
import { defsDir, IDL } from '#lib/source/source.paths'

/** The stem `writeText` wants: an absolute path with the extension removed. */
function defStem(root, version, file) {
  return resolve(defsDir(root, version), basename(file, `.${IDL}`))
}

/**
 * Downloads a release and writes it.
 *
 * The schema takes the version root, the rest go under `defs/`, mirroring the
 * siblings — the fetched document alone at the top, everything else below it.
 *
 * @returns {Promise<{url: string, files: string[]}>}
 */
export async function vendorRelease(root, version) {
  const url = sourceUrl(version, SCHEMA)

  const wanted = [
    { stem: documentStem(root, version), url },
    ...DEFS_FILES.map(file => ({ stem: defStem(root, version, file), url: sourceUrl(version, file) })),
  ]

  const files = await Promise.all(wanted.map(async source => {
    const text = await fetchText(source.url)

    return writeText(source.stem, text, IDL)
  }))

  return { url, files }
}
