/** Terminal output shared by every specification CLI. */

import { relative } from 'node:path'

/** The pointer's tail is what differs between fragments; the prefix is noise. */
function short(pointer) {
  return pointer.replace(/^.*#/, '#')
}

export function reportFragments(written) {
  const width = Math.max(...written.map(fragment => fragment.file.length))

  for (const fragment of written) {
    console.log(`  ${fragment.file.padEnd(width)}  ${fragment.pointers.map(short).join('  |  ')}`)
  }
}

export function reportVendored(url, files, root) {
  console.log(`fetched ${url}`)

  for (const file of files) console.log(`  -> ${relative(root, file).replaceAll('\\', '/')}`)
}
