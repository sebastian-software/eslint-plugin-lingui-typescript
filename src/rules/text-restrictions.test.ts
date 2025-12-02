import { RuleTester } from "@typescript-eslint/rule-tester"
import { afterAll, describe, it } from "vitest"

import { textRestrictions } from "./text-restrictions.js"

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

const quotesRule = {
  patterns: ["''", "'", "\u201c"],
  message: `Quotes should be ' or "`
}

const bracketRule = {
  patterns: ["<", ">", "&lt;", "&gt;"],
  message: "Exclude <,> symbols from translations"
}

const wordRule = {
  patterns: ["e-mail"],
  message: "Use email instead of e-mail",
  flags: "i"
}

const lineBreakRule = {
  patterns: ["^\\n", "\\n$", "^\\r\\n", "\\r\\n$"],
  message: "No line breaks"
}

ruleTester.run("text-restrictions", textRestrictions, {
  valid: [
    // Default options (no restrictions)
    "t`Hello World`",
    "<Trans>Hello World</Trans>",

    // With minLength, messages meeting requirement
    {
      code: "t`Hello World`",
      options: [{ rules: [], minLength: 5 }]
    },
    {
      code: "<Trans>Hello World</Trans>",
      options: [{ rules: [], minLength: 5 }]
    },

    // With forbidden patterns, messages not matching
    {
      code: "t`Hello World`",
      options: [{ rules: [quotesRule], minLength: null }]
    },
    {
      code: "<Trans>Hello World</Trans>",
      options: [{ rules: [bracketRule], minLength: null }]
    },

    // Empty messages don't trigger minLength (handled by other rules)
    {
      code: "t``",
      options: [{ rules: [], minLength: 5 }]
    },

    // Non-Lingui templates ignored
    {
      code: "css`&nbsp;`",
      options: [{ rules: [{ patterns: ["&nbsp;"], message: "no nbsp" }], minLength: null }]
    },

    // Non-Trans JSX ignored
    {
      code: "<div>X</div>",
      options: [{ rules: [], minLength: 5 }]
    },

    // Case-sensitive by default (no flags)
    {
      code: "<Trans>Email</Trans>",
      options: [{ rules: [wordRule], minLength: null }]
    },
    {
      code: "<Trans>email</Trans>",
      options: [{ rules: [wordRule], minLength: null }]
    },

    // Text without forbidden line breaks
    {
      code: "<Trans>hello world</Trans>",
      options: [{ rules: [lineBreakRule], minLength: null }]
    }
  ],
  invalid: [
    // Forbidden pattern: fancy quotes
    {
      code: "t`Hell\u201co\u201d`",
      options: [{ rules: [quotesRule], minLength: null }],
      errors: [{ messageId: "forbiddenPattern", data: { message: quotesRule.message } }]
    },

    // Forbidden pattern in JSX (HTML entity)
    {
      code: "<Trans>Hello&lt;World</Trans>",
      options: [{ rules: [bracketRule], minLength: null }],
      errors: [{ messageId: "forbiddenPattern", data: { message: bracketRule.message } }]
    },

    // Case-insensitive matching with flags
    {
      code: "<Trans>E-mail</Trans>",
      options: [{ rules: [wordRule], minLength: null }],
      errors: [{ messageId: "forbiddenPattern", data: { message: wordRule.message } }]
    },
    {
      code: "<Trans>e-mail</Trans>",
      options: [{ rules: [wordRule], minLength: null }],
      errors: [{ messageId: "forbiddenPattern", data: { message: wordRule.message } }]
    },

    // Multiple forbidden patterns matched
    {
      code: "t`Hello&lt;&gt;World`",
      options: [{ rules: [bracketRule], minLength: null }],
      errors: [
        { messageId: "forbiddenPattern", data: { message: bracketRule.message } },
        { messageId: "forbiddenPattern", data: { message: bracketRule.message } }
      ]
    },

    // Too short message
    {
      code: "t`Hi`",
      options: [{ rules: [], minLength: 5 }],
      errors: [{ messageId: "tooShort" }]
    },
    {
      code: "t`X`",
      options: [{ rules: [], minLength: 2 }],
      errors: [{ messageId: "tooShort" }]
    },

    // Too short JSX message
    {
      code: "<Trans>Hi</Trans>",
      options: [{ rules: [], minLength: 5 }],
      errors: [{ messageId: "tooShort" }]
    },

    // Both forbidden pattern and too short
    {
      code: "t`X<`",
      options: [{ rules: [bracketRule], minLength: 5 }],
      errors: [{ messageId: "forbiddenPattern" }, { messageId: "tooShort" }]
    },

    // Multiple rules, multiple errors
    {
      code: "t`Hell\u201co\u201d<`",
      options: [{ rules: [quotesRule, bracketRule], minLength: null }],
      errors: [
        { messageId: "forbiddenPattern", data: { message: quotesRule.message } },
        { messageId: "forbiddenPattern", data: { message: bracketRule.message } }
      ]
    }
  ]
})
