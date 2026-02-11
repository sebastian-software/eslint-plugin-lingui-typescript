/**
 * ESLint Plugin for Lingui with TypeScript type-aware rules
 *
 * @packageDocumentation
 */

import { consistentPluralFormat } from "./rules/consistent-plural-format.js"
import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const packageJsonPath = resolve(dirname(fileURLToPath(import.meta.url)), "../package.json")
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as { version?: string }
const PLUGIN_VERSION = packageJson.version ?? "0.0.0"
import { noExpressionInMessage } from "./rules/no-expression-in-message.js"
import { noNestedMacros } from "./rules/no-nested-macros.js"
import { noSingleTagToTranslate } from "./rules/no-single-tag-to-translate.js"
import { noSingleVariablesToTranslate } from "./rules/no-single-variables-to-translate.js"
import { noUnlocalizedStrings } from "./rules/no-unlocalized-strings.js"
import { preferTransInJsx } from "./rules/prefer-trans-in-jsx.js"
import { textRestrictions } from "./rules/text-restrictions.js"
import { tCallInFunction } from "./rules/t-call-in-function.js"

const plugin = {
  meta: {
    name: "eslint-plugin-lingui-typescript",
    version: PLUGIN_VERSION
  },
  rules: {
    "consistent-plural-format": consistentPluralFormat,
    "no-expression-in-message": noExpressionInMessage,
    "no-nested-macros": noNestedMacros,
    "no-single-tag-to-translate": noSingleTagToTranslate,
    "no-single-variables-to-translate": noSingleVariablesToTranslate,
    "no-unlocalized-strings": noUnlocalizedStrings,
    "prefer-trans-in-jsx": preferTransInJsx,
    "text-restrictions": textRestrictions,
    "t-call-in-function": tCallInFunction
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
      "lingui-ts/no-expression-in-message": "error",
      "lingui-ts/no-nested-macros": "error",
      "lingui-ts/no-single-tag-to-translate": "error",
      "lingui-ts/no-single-variables-to-translate": "error",
      "lingui-ts/no-unlocalized-strings": "error",
      "lingui-ts/t-call-in-function": "error",
      "lingui-ts/prefer-trans-in-jsx": "warn"
      // text-restrictions not in recommended (requires configuration)
    }
  }
}

export default plugin
