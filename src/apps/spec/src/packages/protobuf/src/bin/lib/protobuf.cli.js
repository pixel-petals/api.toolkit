/**
 * The specification CLI, wired locally.
 *
 * The same commands, arguments and options as the shared builder — the shared
 * one is driven by a descriptor whose every stage assumes a JSON Schema
 * document, and protobuf has none to give it.
 */

import { Command } from 'commander'

import { releasesCommand } from '@util/api/spec/spec.releases'

import { bundleCommand, unbundleCommand } from '#lib/protobuf.bundle'
import { fetchCommand, listCommand, splitCommand } from '#lib/protobuf.commands'
import { protobuf } from '#lib/protobuf.spec'

/** @type {[string, string]} */
const QUIET = [ '-q, --quiet', 'print the summary only' ]

/** @type {[string, string]} */
const VERSION = [ '<version>', `version, e.g. ${protobuf.versionHint}` ]

export function createCli() {
  const program = new Command()

  program.name(protobuf.name).description(protobuf.description)

  program.command('fetch')
    .description('download a release and vendor it')
    .argument(...VERSION)
    .action(fetchCommand)

  program.command('split')
    .description('generate fragments from a vendored schema')
    .argument(...VERSION)
    .option(...QUIET)
    .action(splitCommand)

  program.command('generate')
    .description('fetch then split, in one step')
    .argument(...VERSION)
    .option(...QUIET)
    .action(async (version, options) => {
      await fetchCommand(version)
      splitCommand(version, options)
    })

  program.command('list')
    .description('the versions already vendored')
    .action(listCommand)

  program.command('releases')
    .description('the versions upstream publishes, and which are vendored')
    .action(releasesCommand(protobuf))

  program.command('bundle')
    .description('resolve a .proto and its imports into one JSON descriptor')
    .argument('<entry>', 'the entry .proto file')
    .option('-o, --out <file>', 'where to write it')
    .action(bundleCommand)

  program.command('unbundle')
    .description('split a bundled descriptor into one file per declaration')
    .argument('<descriptor>', 'a bundled descriptor, or the .proto it came from')
    .option('-o, --out <directory>', 'where to write the tree')
    .option('--stem <name>', 'basename for the root document', 'spec')
    .action(unbundleCommand)

  return program
}

/** Parses and reports a failure as a message rather than a stack. */
export function run() {
  return createCli().parseAsync().catch(error => {
    console.error(error.message)
    process.exitCode = 1
  })
}
