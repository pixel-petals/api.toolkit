#!/usr/bin/env node

/**
 * Populates the vendored asyncapi schema tree.
 *
 * schema/<version>/schema.{json,yaml}              the published schema
 * schema/<version>/defs/<group>/<name>.{json,yaml} one per $ref-able object
 *
 * See readme.md.
 */

import { run } from '@util/api/spec/spec.cli'

import { asyncapi } from '#lib/asyncapi.spec'

run(asyncapi)
