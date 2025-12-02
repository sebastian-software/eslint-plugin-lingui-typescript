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
    // ==================== Simple Identifiers ====================
    // These are the recommended way to use variables in Lingui
    "t`Hello ${name}`",
    "t`You have ${count} items`",
    "t`${greeting}, ${name}!`",
    "<Trans>Hello {name}</Trans>",
    "<Trans>You have {count} items</Trans>",

    // ==================== Allowed Function Calls ====================
    // Lingui's built-in formatters (default allowedCallees)
    "t`Price: ${i18n.number(price)}`",
    "t`Date: ${i18n.date(date)}`",
    "<Trans>Price: {i18n.number(price)}</Trans>",
    "<Trans>Date: {i18n.date(date)}</Trans>",

    // ==================== Lingui Helpers ====================
    // These are always allowed for pluralization and selection
    "t`Hello ${plural(count, { one: '#', other: '#' })}`",
    "t`Hello ${select(gender, { male: 'he', other: 'they' })}`",
    "t`Hello ${selectOrdinal(pos, { one: '#st', other: '#th' })}`",

    // ==================== Member Expressions (when enabled) ====================
    {
      code: "t`Hello ${props.name}`",
      options: [{ allowMemberExpressions: true, allowedCallees: [], maxExpressionDepth: 1 }]
    },
    {
      code: "<Trans>Hello {user.name}</Trans>",
      options: [{ allowMemberExpressions: true, allowedCallees: [], maxExpressionDepth: 1 }]
    },

    // ==================== Non-Lingui (Ignored) ====================
    // Other tagged templates should not be checked
    "css`color: ${theme.primary}`",
    "html`<div>${content}</div>`",
    // Other JSX components should not be checked
    "<div>{Math.random()}</div>",
    "<Plural>{count * 2}</Plural>",

    // ==================== JSX Whitespace ====================
    // Whitespace expressions are commonly used for spacing
    "<Trans>Did you mean{' '}<span>something</span></Trans>",
    "<Trans>Hello{` `}World</Trans>",
    "<Trans>{' '}</Trans>"
  ],
  invalid: [
    // ==================== Binary Expressions ====================
    // Math operations should be done outside the translation
    {
      code: "t`Price: ${price * 1.2}`",
      errors: [{ messageId: "complexExpression" }]
    },
    {
      code: "<Trans>Total: {count + 1}</Trans>",
      errors: [{ messageId: "complexExpression" }]
    },

    // ==================== Non-Allowed Function Calls ====================
    // Functions not in allowedCallees should be extracted
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

    // ==================== Member Expressions (default: not allowed) ====================
    // By default, member expressions are disallowed to keep translations simple
    {
      code: "t`Hello ${user.name}`",
      errors: [{ messageId: "complexExpression" }]
    },
    {
      code: "<Trans>Hello {props.value}</Trans>",
      errors: [{ messageId: "complexExpression" }]
    },

    // ==================== Deep Member Expressions ====================
    // Even when member expressions are allowed, deep nesting is not
    {
      code: "t`Street: ${user.address.street}`",
      options: [{ allowMemberExpressions: true, allowedCallees: [], maxExpressionDepth: 1 }],
      errors: [{ messageId: "complexExpression" }]
    },

    // ==================== Optional Chaining ====================
    // Optional chaining implies the value might be undefined
    {
      code: "t`Name: ${user?.name}`",
      options: [{ allowMemberExpressions: true, allowedCallees: [], maxExpressionDepth: 1 }],
      errors: [{ messageId: "complexExpression" }]
    },

    // ==================== Conditional Expressions ====================
    // Ternaries should use plural/select instead
    {
      code: "t`Status: ${isActive ? 'Active' : 'Inactive'}`",
      errors: [{ messageId: "complexExpression" }]
    },
    {
      code: "<Trans>Status: {isActive ? 'on' : 'off'}</Trans>",
      errors: [{ messageId: "complexExpression" }]
    },

    // ==================== Logical Expressions ====================
    // Default values should be handled outside the translation
    {
      code: "t`Name: ${name || 'Unknown'}`",
      errors: [{ messageId: "complexExpression" }]
    },

    // ==================== Nested Template Literals ====================
    {
      code: "t`Value: ${`nested ${x}`}`",
      errors: [{ messageId: "complexExpression" }]
    },

    // ==================== Multiple Violations ====================
    {
      code: "t`${a + b} and ${Math.random()}`",
      errors: [{ messageId: "complexExpression" }, { messageId: "complexExpression" }]
    },
    {
      code: "<Trans>{x * 2} plus {y * 3}</Trans>",
      errors: [{ messageId: "complexExpression" }, { messageId: "complexExpression" }]
    },

    // ==================== Legacy Placeholder Syntax ====================
    // The ${{name: value}} syntax is from older Lingui versions and should not be used
    {
      code: "t`hello ${{name: user}}`",
      errors: [{ messageId: "legacyPlaceholder" }]
    },
    {
      code: "t`hello ${{name: obj.prop}}`",
      errors: [{ messageId: "legacyPlaceholder" }]
    },
    {
      code: "<Trans>hello {{name: user}}</Trans>",
      errors: [{ messageId: "legacyPlaceholder" }]
    },
    {
      code: "t`hello ${{name: user, age: userAge}}`",
      errors: [{ messageId: "legacyPlaceholder" }]
    }
  ]
})
