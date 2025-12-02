/**
 * ESLint Plugin for Lingui with TypeScript type-aware rules
 *
 * @packageDocumentation
 */

import { noSingleVariableMessage } from "./rules/no-single-variable-message.js"

const plugin = {
  meta: {
    name: "eslint-plugin-lingui-typescript",
    version: "1.0.0"
  },
  rules: {
    "no-single-variable-message": noSingleVariableMessage
  },
  configs: {} as Record<string, unknown>
}

// Add flat config with self-reference
plugin.configs = {
  "flat/recommended": {
    plugins: {
      "lingui-ts": plugin
    },
    rules: {
      "lingui-ts/no-single-variable-message": "error"
    }
  }
}

export default plugin
