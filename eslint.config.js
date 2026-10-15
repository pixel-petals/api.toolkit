import { defineConfig } from 'eslint/config'
import { config } from '@px-petals/web.config/eslint'

export default defineConfig([
  // the Yaak CLI bundles a plugin into build/ and has no option to move it
  ...config({ ignores: [ '**/build/**' ] }),
])
