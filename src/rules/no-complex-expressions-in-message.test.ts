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
    // The ONLY thing allowed in Lingui messages
    "t`Hello ${name}`",
    "t`You have ${count} items`",
    "t`${greeting}, ${name}!`",
    "<Trans>Hello {name}</Trans>",
    "<Trans>You have {count} items</Trans>",

    // ==================== Non-Lingui (Ignored) ====================
    // Other tagged templates are not checked
    "css`color: ${theme.primary}`",
    "html`<div>${content}</div>`",
    // Other JSX components are not checked
    "<div>{Math.random()}</div>",
    "<Button onClick={() => doSomething()}>{label}</Button>",

    // ==================== JSX Whitespace ====================
    // Whitespace expressions for spacing
    "<Trans>Did you mean{' '}<span>something</span></Trans>",
    "<Trans>Hello{` `}World</Trans>",
    "<Trans>{' '}</Trans>"
  ],
  invalid: [
    // ==================== Function Calls ====================
    // ALL function calls must be extracted to named variables
    {
      code: "t`Price: ${i18n.number(price)}`",
      errors: [{ messageId: "complexExpression" }]
    },
    {
      code: "t`Date: ${i18n.date(date)}`",
      errors: [{ messageId: "complexExpression" }]
    },
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

    // ==================== Member Expressions ====================
    // Must extract to variable: const userName = user.name
    {
      code: "t`Hello ${user.name}`",
      errors: [{ messageId: "complexExpression" }]
    },
    {
      code: "<Trans>Hello {props.value}</Trans>",
      errors: [{ messageId: "complexExpression" }]
    },
    {
      code: "t`Street: ${user.address.street}`",
      errors: [{ messageId: "complexExpression" }]
    },
    {
      code: "t`Name: ${user?.name}`",
      errors: [{ messageId: "complexExpression" }]
    },

    // ==================== Binary/Logical/Conditional ====================
    {
      code: "t`Price: ${price * 1.2}`",
      errors: [{ messageId: "complexExpression" }]
    },
    {
      code: "<Trans>Total: {count + 1}</Trans>",
      errors: [{ messageId: "complexExpression" }]
    },
    {
      code: "t`Status: ${isActive ? 'Active' : 'Inactive'}`",
      errors: [{ messageId: "complexExpression" }]
    },
    {
      code: "<Trans>Status: {isActive ? 'on' : 'off'}</Trans>",
      errors: [{ messageId: "complexExpression" }]
    },
    {
      code: "t`Name: ${name || 'Unknown'}`",
      errors: [{ messageId: "complexExpression" }]
    },

    // ==================== Nested Templates ====================
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

    // ==================== Lingui Helpers (use JSX components instead) ====================
    // plural(), select(), selectOrdinal() should use <Plural>, <Select>, <SelectOrdinal>
    {
      code: "t`You have ${plural(count, { one: '#', other: '#' })}`",
      errors: [{ messageId: "complexExpression" }]
    },
    {
      code: "t`${select(gender, { male: 'he', other: 'they' })}`",
      errors: [{ messageId: "complexExpression" }]
    },

    // ==================== Legacy Placeholder Syntax ====================
    {
      code: "t`hello ${{name: user}}`",
      errors: [{ messageId: "legacyPlaceholder" }]
    },
    {
      code: "<Trans>hello {{name: user}}</Trans>",
      errors: [{ messageId: "legacyPlaceholder" }]
    }
  ]
})
