/** Terminal output, in the shape every specification CLI in the repo prints. */

import { relative } from 'node:path'

function fromRoot(file, root) {
  return relative(root, file).replaceAll('\\', '/')
}

/** "1 file", "4 files" — a count reads badly with a bracketed plural. */
function count(total, noun) {
  return `${total} ${noun}${total === 1 ? '' : 's'}`
}

export function reportVendored(url, files, root) {
  console.log(`fetched ${url}`)

  for (const file of files) console.log(`  -> ${fromRoot(file, root)}`)
}

/** One line per fragment: where it landed, and what it describes. */
export function reportFragments(written, root) {
  const paths = written.map(fragment => fromRoot(fragment.file, root))
  const width = Math.max(...paths.map(path => path.length))

  written.forEach((fragment, index) => {
    console.log(`  ${paths[ index ].padEnd(width)}  ${fragment.kind} ${fragment.name}`)
  })
}

/** `bundle`: how many files went in, and the one that came out. */
export function reportBundled(source, files, written) {
  console.log(`bundled ${source} from ${count(files.length, 'file')}`)
  console.log(`  -> ${written}`)
}

/** `unbundle`: how much came out, and where it went. */
export function reportUnbundled(source, files, pieces, into) {
  console.log(`unbundled ${source} into ${count(files.length, 'file')} (${count(pieces.length, 'declaration')} lifted out)`)
  console.log(`  -> ${into}`)
}
