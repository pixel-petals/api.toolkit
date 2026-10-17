#!/usr/bin/env node

/**
 * Populates the vendored protobuf schema tree.
 *
 * schema/<version>/schema.proto              descriptor.proto, verbatim
 * schema/<version>/schema.json               the same schema, parsed
 * schema/<version>/defs/<name>.proto         the well-known types, verbatim
 * schema/<version>/defs/fragments/<name>.json  one per top-level declaration
 *
 * See readme.md.
 */

import { run } from '#lib/protobuf.cli'

run()
