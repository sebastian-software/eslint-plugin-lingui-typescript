import { RuleTester } from "@typescript-eslint/rule-tester"
import { afterAll, describe, it } from "vitest"

import { noNestedMacros } from "./no-nested-macros.js"

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

ruleTester.run("no-nested-macros", noNestedMacros, {
  valid: [
    // Separate, non-nested usage
    "t`Hello`; t`World`",
    "<Trans>Hello</Trans>; <Trans>World</Trans>",

    // Normal usage without nesting
    "t`Hello ${name}`",
    "<Trans>Hello {name}</Trans>",
    "msg({ message: 'Hello' })",
    "defineMessage({ message: 'Hello' })",

    // Non-Lingui nested templates
    "css`color: ${theme.primary}`",
    "html`<div>${content}</div>`",

    // Different macros allowed when allowDifferentMacros is true
    {
      code: "<Trans>{t`Hello`}</Trans>",
      options: [{ macros: ["t", "Trans"], allowDifferentMacros: true }]
    },
    {
      code: "t`foo ${msg({ message: 'bar' })}`",
      options: [{ macros: ["t", "msg"], allowDifferentMacros: true }]
    }
  ],
  invalid: [
    // t inside t
    {
      code: "t`foo ${t`bar`}`",
      errors: [{ messageId: "nestedMacro", data: { macro: "t", parent: "t" } }]
    },

    // Trans inside Trans
    {
      code: "<Trans><Trans>Inner</Trans></Trans>",
      errors: [{ messageId: "nestedMacro", data: { macro: "Trans", parent: "Trans" } }]
    },

    // t inside Trans
    {
      code: "<Trans>{t`Hello`}</Trans>",
      errors: [{ messageId: "nestedMacro", data: { macro: "t", parent: "Trans" } }]
    },

    // Trans inside t
    {
      code: "t`foo ${<Trans>bar</Trans>}`",
      errors: [{ messageId: "nestedMacro", data: { macro: "Trans", parent: "t" } }]
    },

    // msg inside t
    {
      code: "t`foo ${msg({ message: 'bar' })}`",
      errors: [{ messageId: "nestedMacro", data: { macro: "msg", parent: "t" } }]
    },

    // defineMessage inside Trans
    {
      code: "<Trans>{defineMessage({ message: 'test' })}</Trans>",
      errors: [{ messageId: "nestedMacro", data: { macro: "defineMessage", parent: "Trans" } }]
    },

    // Multiple nested macros
    {
      code: "t`${t`a`} and ${t`b`}`",
      errors: [
        { messageId: "nestedMacro", data: { macro: "t", parent: "t" } },
        { messageId: "nestedMacro", data: { macro: "t", parent: "t" } }
      ]
    },

    // Same macro nested when allowDifferentMacros is true
    {
      code: "<Trans><Trans>Inner</Trans></Trans>",
      options: [{ macros: ["t", "Trans"], allowDifferentMacros: true }],
      errors: [{ messageId: "nestedMacro", data: { macro: "Trans", parent: "Trans" } }]
    },
    {
      code: "t`${t`inner`}`",
      options: [{ macros: ["t", "Trans"], allowDifferentMacros: true }],
      errors: [{ messageId: "nestedMacro", data: { macro: "t", parent: "t" } }]
    }
  ]
})
