import { RuleTester } from "@typescript-eslint/rule-tester"
import { afterAll, describe, it } from "vitest"

import { consistentPluralFormat } from "./consistent-plural-format.js"

RuleTester.afterAll = afterAll
RuleTester.describe = describe
RuleTester.it = it

const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      ecmaVersion: 2022,
      sourceType: "module"
    }
  }
})

ruleTester.run("consistent-plural-format", consistentPluralFormat, {
  valid: [
    // All required keys present (default: one, other)
    "plural(count, { one: '# item', other: '# items' })",
    "plural(count, { one: 'One', other: 'Many', zero: 'None' })",

    // With i18n prefix
    "i18n.plural(count, { one: '# item', other: '# items' })",

    // Custom required keys
    {
      code: "plural(count, { other: 'items' })",
      options: [{ requiredKeys: ["other"] }]
    },
    {
      code: "plural(count, { one: '#', other: '#', zero: 'none' })",
      options: [{ requiredKeys: ["one", "other", "zero"] }]
    },

    // Non-plural calls should be ignored
    "select(value, { male: 'He', female: 'She', other: 'They' })",
    "someOtherFunction({ one: 'x' })",

    // No object argument (edge case)
    "plural(count)"
  ],
  invalid: [
    // Missing 'other' (default required)
    {
      code: "plural(count, { one: '# item' })",
      errors: [{ messageId: "missingPluralKey", data: { key: "other" } }]
    },

    // Missing 'one' (default required)
    {
      code: "plural(count, { other: '# items' })",
      errors: [{ messageId: "missingPluralKey", data: { key: "one" } }]
    },

    // Missing both default required keys
    {
      code: "plural(count, { zero: 'None' })",
      errors: [
        { messageId: "missingPluralKey", data: { key: "one" } },
        { messageId: "missingPluralKey", data: { key: "other" } }
      ]
    },

    // With i18n prefix
    {
      code: "i18n.plural(count, { one: '# item' })",
      errors: [{ messageId: "missingPluralKey", data: { key: "other" } }]
    },

    // Custom required keys missing
    {
      code: "plural(count, { one: '#', other: '#' })",
      options: [{ requiredKeys: ["one", "other", "zero"] }],
      errors: [{ messageId: "missingPluralKey", data: { key: "zero" } }]
    },

    // Empty object
    {
      code: "plural(count, {})",
      errors: [
        { messageId: "missingPluralKey", data: { key: "one" } },
        { messageId: "missingPluralKey", data: { key: "other" } }
      ]
    }
  ]
})

