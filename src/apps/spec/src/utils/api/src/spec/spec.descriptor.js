/**
 * What a specification package contributes.
 *
 * Everything else — fetching, normalizing, laying out fragments, the CLI — is
 * shared, so a package is this object and a `schema/` directory.
 */

import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * @typedef {object} SpecDescriptor
 * @property {string}   name            the CLI's name, e.g. "openapi"
 * @property {string}   description     one line, shown in `--help`
 * @property {string}   root            absolute path to the schema directory
 * @property {Function} url             (version, date) => the release URL
 * @property {Function} releases        () => the releases upstream publishes
 * @property {Function} [releaseOf]     (document) => which release a vendored copy holds
 * @property {Function} [bundle]        (file) => a bundler of the specification's own
 * @property {Function} [versionOf]     (document) => the vendored version it declares
 * @property {boolean}  [dated]         true when a release is addressed by date
 * @property {string}   [componentsKey] root key naming the reusable-object map
 * @property {string}   [sourceFormat]  the encoding upstream publishes, defaulting to JSON
 * @property {string[]} [formats]       what to write, defaulting to JSON and YAML
 * @property {string}   [versionHint]   example version, shown in `--help`
 * @property {string}   [dateHint]      example date, shown in `--help`
 */

/**
 * The `schema/` directory beside a package's `bin/`.
 *
 * Resolved from the calling module's own URL, so a package never spells out a
 * path that would break the moment its files move.
 */
export function schemaRoot(moduleUrl) {
  return resolve(dirname(fileURLToPath(moduleUrl)), '../../schema')
}
