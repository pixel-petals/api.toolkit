#!/usr/bin/env node

/**
 * Populates the vendored arazzo schema tree.
 *
 * schema/<version>/schema.{json,yaml}              the published schema
 * schema/<version>/defs/<group>/<name>.{json,yaml} one per $ref-able object
 *
 * See readme.md.
 */

import { run } from '@util/api/spec/spec.cli'

import { arazzo } from '#lib/arazzo.spec'

run(arazzo)
