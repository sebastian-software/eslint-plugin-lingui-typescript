import { RuleTester } from "@typescript-eslint/rule-tester"
import { afterAll, describe, it } from "vitest"

import { noComplexExpressionsInMessage } from "./no-complex-expressions-in-message.js"

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

ruleTester.run("no-complex-expressions-in-message", noComplexExpressionsInMessage, {
  valid: [
    // Simple identifiers in t``
    "t`Hello ${name}`",
    "t`You have ${count} items`",
    "t`${greeting}, ${name}!`",

    // Simple identifiers in <Trans>
    "<Trans>Hello {name}</Trans>",
    "<Trans>You have {count} items</Trans>",

    // Allowed callees (default: i18n.number, i18n.date)
    "t`Price: ${i18n.number(price)}`",
    "t`Date: ${i18n.date(date)}`",
    "<Trans>Price: {i18n.number(price)}</Trans>",
    "<Trans>Date: {i18n.date(date)}</Trans>",

    // Member expressions when allowed
    {
      code: "t`Hello ${props.name}`",
      options: [{ allowMemberExpressions: true, allowedCallees: [], maxExpressionDepth: 1 }]
    },
    {
      code: "<Trans>Hello {user.name}</Trans>",
      options: [{ allowMemberExpressions: true, allowedCallees: [], maxExpressionDepth: 1 }]
    },

    // Non-Lingui tagged templates should be ignored
    "css`color: ${theme.primary}`",
    "html`<div>${content}</div>`",

    // Non-Trans JSX elements should be ignored
    "<div>{Math.random()}</div>",
    "<Plural>{count * 2}</Plural>"
  ],
  invalid: [
    // Binary expressions
    {
      code: "t`Price: ${price * 1.2}`",
      errors: [{ messageId: "complexExpression" }]
    },
    {
      code: "<Trans>Total: {count + 1}</Trans>",
      errors: [{ messageId: "complexExpression" }]
    },

    // Non-whitelisted function calls
    {
      code: "t`Random: ${Math.random()}`",
      errors: [{ messageId: "complexExpression" }]
    },
    {
      code: "<Trans>Date: {formatDate(date)}</Trans>",
      errors: [{ messageId: "complexExpression" }]
    },
    {
      code: "t`Items: ${items.join(', ')}`",
      errors: [{ messageId: "complexExpression" }]
    },

    // Member expressions when not allowed (default)
    {
      code: "t`Hello ${user.name}`",
      errors: [{ messageId: "complexExpression" }]
    },
    {
      code: "<Trans>Hello {props.value}</Trans>",
      errors: [{ messageId: "complexExpression" }]
    },

    // Deep member expressions even when allowed
    {
      code: "t`Street: ${user.address.street}`",
      options: [{ allowMemberExpressions: true, allowedCallees: [], maxExpressionDepth: 1 }],
      errors: [{ messageId: "complexExpression" }]
    },

    // Optional chaining
    {
      code: "t`Name: ${user?.name}`",
      options: [{ allowMemberExpressions: true, allowedCallees: [], maxExpressionDepth: 1 }],
      errors: [{ messageId: "complexExpression" }]
    },

    // Conditional expressions
    {
      code: "t`Status: ${isActive ? 'Active' : 'Inactive'}`",
      errors: [{ messageId: "complexExpression" }]
    },
    {
      code: "<Trans>Status: {isActive ? 'on' : 'off'}</Trans>",
      errors: [{ messageId: "complexExpression" }]
    },

    // Logical expressions
    {
      code: "t`Name: ${name || 'Unknown'}`",
      errors: [{ messageId: "complexExpression" }]
    },

    // Template literals inside
    {
      code: "t`Value: ${`nested ${x}`}`",
      errors: [{ messageId: "complexExpression" }]
    },

    // Multiple violations in one message
    {
      code: "t`${a + b} and ${Math.random()}`",
      errors: [
        { messageId: "complexExpression" },
        { messageId: "complexExpression" }
      ]
    },
    {
      code: "<Trans>{x * 2} plus {y * 3}</Trans>",
      errors: [
        { messageId: "complexExpression" },
        { messageId: "complexExpression" }
      ]
    }
  ]
})

