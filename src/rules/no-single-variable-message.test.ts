import { RuleTester } from "@typescript-eslint/rule-tester"
import { afterAll, describe, it } from "vitest"

import { noSingleVariableMessage } from "./no-single-variable-message.js"

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

ruleTester.run("no-single-variable-message", noSingleVariableMessage, {
  valid: [
    // Template with text and variable
    "t`Hello ${name}`",
    "t`Status: ${status}`",
    "t`${count} items`",

    // Template with only text
    "t`Hello World`",

    // Template with multiple variables
    "t`${first} and ${second}`",

    // JSX with text and variable
    "<Trans>Hello {name}</Trans>",
    "<Trans>Status: {status}</Trans>",
    "<Trans>{count} items</Trans>",

    // JSX with only text
    "<Trans>Hello World</Trans>",

    // JSX with multiple children
    "<Trans>{first} and {second}</Trans>",

    // Non-Lingui tagged templates (should be ignored)
    "css`${variable}`",
    "html`${content}`",

    // Non-Trans JSX elements (should be ignored)
    "<Plural>{count}</Plural>",
    "<div>{content}</div>",

    // Trans with id prop (lazy translation lookup)
    "<Trans id={lazyTranslation.id} />",
    '<Trans id="some-id" />'
  ],
  invalid: [
    // Template with only variable
    {
      code: "t`${status}`",
      errors: [{ messageId: "singleVariable" }]
    },
    {
      code: "t`${user.name}`",
      errors: [{ messageId: "singleVariable" }]
    },
    // Template with variable and whitespace only
    {
      code: "t` ${status} `",
      errors: [{ messageId: "singleVariable" }]
    },

    // JSX with only variable
    {
      code: "<Trans>{status}</Trans>",
      errors: [{ messageId: "singleVariable" }]
    },
    {
      code: "<Trans>{user.name}</Trans>",
      errors: [{ messageId: "singleVariable" }]
    },
    // JSX with variable and whitespace only
    {
      code: "<Trans>  {status}  </Trans>",
      errors: [{ messageId: "singleVariable" }]
    },

    // Multiple expressions with whitespace (only variables)
    {
      code: "<Trans>{hello} {hello}</Trans>",
      errors: [{ messageId: "singleVariable" }]
    },
    {
      code: "<Trans>{limitType}{' '}{formatCurrency(value, currency)}</Trans>",
      errors: [{ messageId: "singleVariable" }]
    },
    {
      code: "<Trans>{formatCurrency(a, b)} {formatCurrency(c, d)}</Trans>",
      errors: [{ messageId: "singleVariable" }]
    }
  ]
})
