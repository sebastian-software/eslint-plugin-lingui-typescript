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
    // ==================== Hash style (default) - Valid ====================
    // plural() function with hash
    `plural(numBooks, { one: "# book", other: "# books" })`,
    `plural(count, { zero: "# items", one: "# item", other: "# items" })`,
    // Template string OK as long as using hash
    "plural(count, { one: `# item`, other: `# items` })",

    // <Plural> component with hash
    '<Plural value={count} one="# item" other="# items" />',
    '<Plural value={count} zero="# items" one="# item" other="# items" />',

    // No variable in some fields (no error because no wrong format used)
    'plural(count, { zero: "You have no items", one: "You have one item", other: "# items" })',

    // ==================== Template style - Valid ====================
    // plural() with template format
    {
      code: "plural(numBooks, { one: `${numBooks} book`, other: `${numBooks} books` })",
      options: [{ style: "template" }]
    },
    {
      code: "plural(count, { zero: `${count} items`, one: `${count} item`, other: `${count} items` })",
      options: [{ style: "template" }]
    },

    // <Plural> with template format
    {
      code: "<Plural value={count} one={`${count} item`} other={`${count} items`} />",
      options: [{ style: "template" }]
    },

    // No variable in some fields (template style)
    {
      code: 'plural(count, { zero: "You have no items", one: "You have one item", other: `${count} items` })',
      options: [{ style: "template" }]
    },

    // ==================== Non-plural calls (ignored) ====================
    "someOtherFunction(numBooks, { one: `${numBooks} book`, other: `${numBooks} books` })",
    "plural(numBooks, someVariable)"
  ],
  invalid: [
    // ==================== Hash style (default) - Invalid ====================
    // plural() with template when hash expected
    {
      code: "plural(numBooks, { one: `${numBooks} book`, other: `${numBooks} books` })",
      errors: [
        { messageId: "hashRequired", data: { key: "one" } },
        { messageId: "hashRequired", data: { key: "other" } }
      ]
    },
    // Mixed: some hash, some template
    {
      code: 'plural(count, { zero: `${count} items`, one: "# item", other: `${count} items` })',
      errors: [
        { messageId: "hashRequired", data: { key: "zero" } },
        { messageId: "hashRequired", data: { key: "other" } }
      ]
    },

    // <Plural> with template when hash expected
    {
      code: "<Plural value={count} one={`${count} item`} other={`${count} items`} />",
      errors: [
        { messageId: "hashRequired", data: { key: "one" } },
        { messageId: "hashRequired", data: { key: "other" } }
      ]
    },

    // ==================== Template style - Invalid ====================
    // plural() with hash when template expected
    {
      code: 'plural(numBooks, { one: "# book", other: "# books" })',
      options: [{ style: "template" }],
      errors: [
        { messageId: "templateRequired", data: { key: "one" } },
        { messageId: "templateRequired", data: { key: "other" } }
      ]
    },
    // Mixed: some template, some hash
    {
      code: 'plural(count, { zero: "# items", one: `${count} item`, other: "# items" })',
      options: [{ style: "template" }],
      errors: [
        { messageId: "templateRequired", data: { key: "zero" } },
        { messageId: "templateRequired", data: { key: "other" } }
      ]
    },

    // <Plural> with hash when template expected
    {
      code: '<Plural value={count} one="# item" other="# items" />',
      options: [{ style: "template" }],
      errors: [
        { messageId: "templateRequired", data: { key: "one" } },
        { messageId: "templateRequired", data: { key: "other" } }
      ]
    }
  ]
})
