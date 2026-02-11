import { RuleTester } from "@typescript-eslint/rule-tester"
import { afterAll, describe, it } from "vitest"

import { preferTransInJsx } from "./prefer-trans-in-jsx.js"

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

ruleTester.run("prefer-trans-in-jsx", preferTransInJsx, {
  valid: [
    // t used outside JSX is fine
    "const msg = t`Save changes`",
    "const msg = t`Hello ${name}`",

    // Trans already used directly
    "<Trans>Save changes</Trans>",
    "<Trans>Hello {name}</Trans>",

    // Non-t tagged templates in JSX are fine
    "<div>{css`color: red`}</div>",

    // Regular expressions in JSX are fine
    "<div>{someFunction()}</div>",
    "<div>{variable}</div>",

    // t inside function calls in JSX — string value expected, not JSX
    "<p>{formatValue(t`City Name`)}</p>",
    "<p>{t`City Name`.toUpperCase()}</p>",
    "<Comp label={t`Save`} />",

    // t inside other non-renderable expressions in JSX
    "<p>{prefix + t`text`}</p>",
    "<p>{`${t`text`}`}</p>"
  ],
  invalid: [
    // Case 1: Direct — simple text, import added
    {
      code: "<button>{t`Save changes`}</button>",
      output: 'import { Trans } from "@lingui/react/macro"\n<button><Trans>Save changes</Trans></button>',
      errors: [{ messageId: "preferTrans" }]
    },

    // Case 1: With expression
    {
      code: "<p>{t`Hello ${name}, welcome!`}</p>",
      output: 'import { Trans } from "@lingui/react/macro"\n<p><Trans>Hello {name}, welcome!</Trans></p>',
      errors: [{ messageId: "preferTrans" }]
    },

    // Case 1: Trans already imported — no duplicate
    {
      code: 'import { Trans } from "@lingui/react/macro"\n<button>{t`Save changes`}</button>',
      output: 'import { Trans } from "@lingui/react/macro"\n<button><Trans>Save changes</Trans></button>',
      errors: [{ messageId: "preferTrans" }]
    },

    // Case 1: Existing @lingui/react/macro import — appends Trans
    {
      code: 'import { useLingui } from "@lingui/react/macro"\n<button>{t`Save changes`}</button>',
      output: 'import { useLingui, Trans } from "@lingui/react/macro"\n<button><Trans>Save changes</Trans></button>',
      errors: [{ messageId: "preferTrans" }]
    },

    // Case 1: Type-only import of Trans — not a value import, so new import is added
    {
      code: 'import type { Trans } from "@lingui/react/macro"\n<button>{t`Save changes`}</button>',
      output:
        'import { Trans } from "@lingui/react/macro"\nimport type { Trans } from "@lingui/react/macro"\n<button><Trans>Save changes</Trans></button>',
      errors: [{ messageId: "preferTrans" }]
    },

    // Case 1: Type-only import statement — don't append to it, add new import
    {
      code: 'import type { useLingui } from "@lingui/react/macro"\n<button>{t`Save changes`}</button>',
      output:
        'import { Trans } from "@lingui/react/macro"\nimport type { useLingui } from "@lingui/react/macro"\n<button><Trans>Save changes</Trans></button>',
      errors: [{ messageId: "preferTrans" }]
    },

    // Case 1: Multiple expressions
    {
      code: "<p>{t`${a} and ${b}`}</p>",
      output: 'import { Trans } from "@lingui/react/macro"\n<p><Trans>{a} and {b}</Trans></p>',
      errors: [{ messageId: "preferTrans" }]
    },

    // Case 2: Ternary — each t`...` replaced individually (two fix passes due to import conflict)
    {
      code: "<span>{isActive ? t`Active` : t`Inactive`}</span>",
      output: [
        'import { Trans } from "@lingui/react/macro"\n<span>{isActive ? <Trans>Active</Trans> : t`Inactive`}</span>',
        'import { Trans } from "@lingui/react/macro"\n<span>{isActive ? <Trans>Active</Trans> : <Trans>Inactive</Trans>}</span>'
      ],
      errors: [{ messageId: "preferTrans" }, { messageId: "preferTrans" }]
    },

    // Case 2: Logical AND — t`...` replaced individually
    {
      code: "<p>{show && t`Hello World`}</p>",
      output: 'import { Trans } from "@lingui/react/macro"\n<p>{show && <Trans>Hello World</Trans>}</p>',
      errors: [{ messageId: "preferTrans" }]
    },

    // Case 2: Nested with expression
    {
      code: "<div>{flag ? t`Hello ${name}` : null}</div>",
      output: 'import { Trans } from "@lingui/react/macro"\n<div>{flag ? <Trans>Hello {name}</Trans> : null}</div>',
      errors: [{ messageId: "preferTrans" }]
    }
  ]
})
