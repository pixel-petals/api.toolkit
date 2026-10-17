/**
 * Builds a specification CLI from a descriptor.
 *
 * Every package gets the same four commands over its own schema tree, so the
 * only thing that varies between them is where a release lives.
 */

import { Command } from 'commander'

import { fetchCommand, listCommand, splitCommand } from '#spec/spec.commands'
import { bundleCommand, unbundleCommand } from '#spec/spec.bundle'
import { releasesCommand } from '#spec/spec.releases'

/** @import { SpecDescriptor } from '#spec/spec.descriptor' */

/** @type {[string, string]} */
const QUIET = [ '-q, --quiet', 'print the summary only' ]

/** A dated specification addresses a release by version and date, e.g. OpenAPI. */
function releaseArgs(spec, command) {
  command.argument('<version>', `version, e.g. ${spec.versionHint ?? '3.2'}`)

  if (spec.dated) command.argument('<date>', `the dated release, e.g. ${spec.dateHint ?? '2025-11-23'}`)

  return command
}

/** @param {SpecDescriptor} spec */
export function createCli(spec) {
  const program = new Command()
  const fetch = fetchCommand(spec)
  const split = splitCommand(spec)

  program.name(spec.name).description(spec.description)

  releaseArgs(spec, program.command('fetch'))
    .description('download a release and vendor it')
    .action(fetch)

  program.command('split')
    .description('generate fragment schemas from a vendored document')
    .argument('<version>', `version, e.g. ${spec.versionHint ?? '3.2'}`)
    .option(...QUIET)
    .action(split)

  releaseArgs(spec, program.command('generate'))
    .description('fetch then split, in one step')
    .option(...QUIET)
    .action(async (...args) => {
      // commander appends two things after the declared arguments: the parsed
      // options, then the command itself
      const [ options ] = args.splice(-2, 2)

      await fetch(...args)
      split(args[ 0 ], options)
    })

  program.command('list')
    .description('the versions already vendored')
    .action(listCommand(spec))

  program.command('releases')
    .description('the versions upstream publishes, and which are vendored')
    .action(releasesCommand(spec))

  program.command('bundle')
    .description('inline every external reference into one file')
    .argument('<document>', 'the root document')
    .option('-o, --out <file>', 'where to write it')
    .action(bundleCommand(spec))

  program.command('unbundle')
    .description('split a document into a tree of files linked by $ref')
    .argument('<document>', 'the root document')
    .option('-o, --out <directory>', 'where to write the tree')
    .option('--stem <name>', 'basename for the root document', 'spec')
    .action(unbundleCommand(spec))

  return program
}

/** Parses and reports a failure as a message rather than a stack. */
export function run(spec) {
  return createCli(spec).parseAsync().catch(error => {
    console.error(error.message)
    process.exitCode = 1
  })
}
