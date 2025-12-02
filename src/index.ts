/**
 * ESLint Plugin for Lingui with TypeScript type-aware rules
 *
 * @packageDocumentation
 */

import { consistentPluralFormat } from "./rules/consistent-plural-format.js"
import { noComplexExpressionsInMessage } from "./rules/no-complex-expressions-in-message.js"
import { noNestedMacros } from "./rules/no-nested-macros.js"
import { noSingleTagMessage } from "./rules/no-single-tag-message.js"
import { noSingleVariableMessage } from "./rules/no-single-variable-message.js"
import { noUnlocalizedStrings } from "./rules/no-unlocalized-strings.js"
import { textRestrictions } from "./rules/text-restrictions.js"
import { validTCallLocation } from "./rules/valid-t-call-location.js"

const plugin = {
  meta: {
    name: "eslint-plugin-lingui-typescript",
    version: "1.0.0"
  },
  rules: {
    "consistent-plural-format": consistentPluralFormat,
    "no-complex-expressions-in-message": noComplexExpressionsInMessage,
    "no-nested-macros": noNestedMacros,
    "no-single-tag-message": noSingleTagMessage,
    "no-single-variable-message": noSingleVariableMessage,
    "no-unlocalized-strings": noUnlocalizedStrings,
    "text-restrictions": textRestrictions,
    "valid-t-call-location": validTCallLocation
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
      "lingui-ts/consistent-plural-format": "error",
      "lingui-ts/no-complex-expressions-in-message": "error",
      "lingui-ts/no-nested-macros": "error",
      "lingui-ts/no-single-tag-message": "error",
      "lingui-ts/no-single-variable-message": "error",
      "lingui-ts/no-unlocalized-strings": "warn",
      "lingui-ts/valid-t-call-location": "error"
      // text-restrictions not in recommended (requires configuration)
    }
  }
}

export default plugin
