#!/usr/bin/env node

/**
 * Populates the vendored GraphQL introspection schema tree.
 *
 * schema/<version>/schema.graphql                       the introspection SDL
 * schema/<version>/schema.json                          the same schema, introspected
 * schema/<version>/defs/fragments/<type>.{graphql,json} one per introspection type
 *
 * See readme.md.
 */

import { run } from '#lib/graphql.cli'
import { graphql } from '#lib/graphql.spec'

run(graphql)
