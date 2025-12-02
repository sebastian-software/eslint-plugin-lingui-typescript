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
      sourceType: "module",
      ecmaFeatures: {
        jsx: true
      }
    }
  }
})

ruleTester.run("consistent-plural-format", consistentPluralFormat, {
  valid: [
    // All required props present (default: one, other)
    '<Plural value={count} one="# item" other="# items" />',
    '<Plural value={count} one="One" other="Many" zero="None" />',

    // With expressions
    "<Plural value={count} one={oneMsg} other={otherMsg} />",

    // Custom required keys
    {
      code: '<Plural value={count} other="items" />',
      options: [{ requiredKeys: ["other"] }]
    },
    {
      code: '<Plural value={count} one="#" other="#" zero="none" />',
      options: [{ requiredKeys: ["one", "other", "zero"] }]
    },

    // Non-Plural components should be ignored
    '<Select value={gender} male="He" female="She" other="They" />',
    '<div one="x" />',
    "<Trans>Hello</Trans>"
  ],
  invalid: [
    // Missing 'other' (default required)
    {
      code: '<Plural value={count} one="# item" />',
      errors: [{ messageId: "missingPluralKey", data: { key: "other" } }]
    },

    // Missing 'one' (default required)
    {
      code: '<Plural value={count} other="# items" />',
      errors: [{ messageId: "missingPluralKey", data: { key: "one" } }]
    },

    // Missing both default required keys
    {
      code: '<Plural value={count} zero="None" />',
      errors: [
        { messageId: "missingPluralKey", data: { key: "one" } },
        { messageId: "missingPluralKey", data: { key: "other" } }
      ]
    },

    // Custom required keys missing
    {
      code: '<Plural value={count} one="#" other="#" />',
      options: [{ requiredKeys: ["one", "other", "zero"] }],
      errors: [{ messageId: "missingPluralKey", data: { key: "zero" } }]
    },

    // Only value prop
    {
      code: "<Plural value={count} />",
      errors: [
        { messageId: "missingPluralKey", data: { key: "one" } },
        { messageId: "missingPluralKey", data: { key: "other" } }
      ]
    }
  ]
})
