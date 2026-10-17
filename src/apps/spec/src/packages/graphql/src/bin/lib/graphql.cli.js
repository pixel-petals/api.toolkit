/**
 * The specification CLI, in the shape `utils/spec/spec.cli` builds for the
 * sibling packages.
 *
 * It is not built by that one. A GraphQL release is a Markdown section rather
 * than a schema document, so fetching and splitting share no steps with the
 * JSON Schema packages — only the commands, their options, and their output.
 */

import { Command } from 'commander'

import { releasesCommand } from '@util/api/spec/spec.releases'

import { bundleCommand, unbundleCommand } from '#lib/graphql.bundle'
import { fetchCommand, listCommand, splitCommand } from '#lib/graphql.commands'

/** @import { SpecDescriptor } from '@util/api/spec/spec.descriptor' */

/** @type {[string, string]} */
const QUIET = [ '-q, --quiet', 'print the summary only' ]

/**
 * Bundling takes a path rather than a version, and either end of a tree.
 *
 * @type {[string, string]}
 */
const SOURCE = [ '<source>', 'a .graphql file, or a directory of them' ]

/** @param {SpecDescriptor} spec */
export function createCli(spec) {
  const program = new Command()
  const fetch = fetchCommand(spec)
  const split = splitCommand(spec)

  /** @type {[string, string]} */
  const version = [ '<version>', `version, e.g. ${spec.versionHint}` ]

  program.name(spec.name).description(spec.description)

  program.command('fetch')
    .description('download a release and vendor it')
    .argument(...version)
    .action(fetch)

  program.command('split')
    .description('generate type fragments from a vendored schema')
    .argument(...version)
    .option(...QUIET)
    .action(split)

  program.command('generate')
    .description('fetch then split, in one step')
    .argument(...version)
    .option(...QUIET)
    .action(async (name, options) => {
      await fetch(name)
      split(name, options)
    })

  program.command('list')
    .description('the versions already vendored')
    .action(listCommand(spec))

  program.command('releases')
    .description('the versions upstream publishes, and which are vendored')
    .action(releasesCommand(spec))

  program.command('bundle')
    .description('merge a tree of SDL files into one document')
    .argument(...SOURCE)
    .option('-o, --out <file>', 'where to write it')
    .action(bundleCommand)

  program.command('unbundle')
    .description('split a schema into one file per definition')
    .argument(...SOURCE)
    .option('-o, --out <directory>', 'where to write the tree')
    .action(unbundleCommand)

  return program
}

/** Parses and reports a failure as a message rather than a stack. */
export function run(spec) {
  return createCli(spec).parseAsync().catch(error => {
    console.error(error.message)
    process.exitCode = 1
  })
}
