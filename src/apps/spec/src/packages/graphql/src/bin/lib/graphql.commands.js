/**
 * The three things this package does: vendor a section, split it into type
 * fragments, and say what is vendored.
 *
 * `fetch` is the only command that touches the network. `split` reads the
 * vendored SDL and nothing else.
 */

import { relative } from 'node:path'

import { versions } from '@util/api/source/source.paths'
import { reportVendored } from '@util/api/spec/spec.report'

import { assertVersion } from '#lib/graphql.spec'
import { extractSdl } from '#lib/sdl/sdl.extract'
import { readSdl } from '#lib/sdl/sdl.files'
import { writeFragments, writeSchema } from '#lib/sdl/sdl.write'

/** @import { SpecDescriptor } from '@util/api/spec/spec.descriptor' */
/** @import { WrittenType } from '#lib/sdl/sdl.write' */

/**
 * The section is Markdown, so there is no JSON to parse on the way in — the
 * shared fetcher has nothing to offer here.
 */
async function fetchMarkdown(url) {
  const response = await fetch(url)

  if (!response.ok) throw new Error(`${response.status} ${response.statusText} — ${url}`)

  return response.text()
}

/** The AST node kind, minus the noise every one of them shares. */
function kind(node) {
  return node.replace(/TypeDefinition$/, '').toLowerCase()
}

/** @param {WrittenType[]} written */
function reportTypes(written, root) {
  const width = Math.max(...written.map(type => type.name.length))

  for (const type of written) {
    const files = type.files.map(file => relative(root, file).replaceAll('\\', '/')).join('  ')

    console.log(`  ${type.name.padEnd(width)}  ${kind(type.kind).padEnd(6)}  ${files}`)
  }
}

/** @param {SpecDescriptor} spec */
export function fetchCommand(spec) {
  return async version => {
    assertVersion(version)

    const url = spec.url(version)
    const sdl = extractSdl(await fetchMarkdown(url), url)
    const files = writeSchema(spec.root, version, sdl)

    reportVendored(url, files, spec.root)
  }
}

/** @param {SpecDescriptor} spec */
export function splitCommand(spec) {
  return (version, options) => {
    assertVersion(version)

    const sdl = readSdl(spec.root, version, `${spec.name} fetch ${version}`)
    const written = writeFragments(spec.root, version, sdl)

    if (!options?.quiet) reportTypes(written, spec.root)

    const files = written.reduce((total, type) => total + type.files.length, 0)

    console.log('')
    console.log(`wrote ${written.length} type fragments to ${version}/ (${files} files)`)
  }
}

/** @param {SpecDescriptor} spec */
export function listCommand(spec) {
  return () => {
    const found = versions(spec.root)

    if (!found.length) return console.log(`nothing vendored yet — run \`${spec.name} fetch <version>\``)

    for (const version of found) console.log(`  ${version}`)
  }
}
