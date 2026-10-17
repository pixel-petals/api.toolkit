/**
 * Pulling the introspection schema out of the specification's prose.
 *
 * GraphQL publishes no machine-readable schema document. The introspection
 * type system exists as SDL inside a fenced code block in Section 4, and
 * everything downstream starts from what this returns.
 */

const FENCE = '```'

/** A declaration of an introspection type, whose names are all `__`-prefixed. */
const DECLARES = /^\s*(type|enum|input|interface|union|scalar)\s+__/m

/**
 * Every fenced block's body, with the fence lines and their info strings
 * dropped.
 *
 * Section 4 nests nothing, so an opening fence and a closing one are told
 * apart by alternation rather than by matching their lengths.
 */
function fences(markdown) {
  const blocks = []
  let block = null

  for (const line of markdown.split(/\r?\n/)) {
    const isFence = line.trimStart().startsWith(FENCE)

    if (isFence && block) {
      blocks.push(block.join('\n'))
      block = null
      continue
    }

    if (isFence) {
      block = []
      continue
    }

    block?.push(line)
  }

  return blocks
}

/**
 * The introspection SDL, concatenated in source order.
 *
 * Blocks are selected by what they declare rather than by their info string:
 * releases before 2018-06 tag no fence at all, and the ones that do tag both
 * examples and schemas `graphql`.
 *
 * @param {string} markdown the section's source
 * @param {string} source   where it came from, for the failure message
 */
export function extractSdl(markdown, source) {
  const blocks = fences(markdown).filter(block => DECLARES.test(block))

  if (!blocks.length) throw new Error(`no introspection type declarations found in ${source}`)

  return `${blocks.join('\n\n').trim()}\n`
}
