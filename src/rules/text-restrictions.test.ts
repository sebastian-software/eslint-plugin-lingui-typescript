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

ruleTester.run("text-restrictions", textRestrictions, {
  valid: [
    // Default options (no restrictions)
    "t`Hello World`",
    "<Trans>Hello World</Trans>",

    // With minLength, messages meeting requirement
    {
      code: "t`Hello World`",
      options: [{ forbiddenPatterns: [], minLength: 5 }]
    },
    {
      code: "<Trans>Hello World</Trans>",
      options: [{ forbiddenPatterns: [], minLength: 5 }]
    },

    // With forbiddenPatterns, messages not matching
    {
      code: "t`Hello World`",
      options: [{ forbiddenPatterns: ["\\n", "&nbsp;"], minLength: null }]
    },
    {
      code: "<Trans>Hello World</Trans>",
      options: [{ forbiddenPatterns: ["<br>", "TODO"], minLength: null }]
    },

    // Empty messages don't trigger minLength (handled by other rules)
    {
      code: "t``",
      options: [{ forbiddenPatterns: [], minLength: 5 }]
    },

    // Non-Lingui templates ignored
    {
      code: "css`&nbsp;`",
      options: [{ forbiddenPatterns: ["&nbsp;"], minLength: null }]
    },

    // Non-Trans JSX ignored
    {
      code: "<div>X</div>",
      options: [{ forbiddenPatterns: [], minLength: 5 }]
    }
  ],
  invalid: [
    // Forbidden pattern: HTML entity
    {
      code: "t`Hello&nbsp;World`",
      options: [{ forbiddenPatterns: ["&nbsp;"], minLength: null }],
      errors: [{ messageId: "forbiddenPattern" }]
    },

    // Forbidden pattern in JSX
    {
      code: "<Trans>HelloTODOWorld</Trans>",
      options: [{ forbiddenPatterns: ["TODO"], minLength: null }],
      errors: [{ messageId: "forbiddenPattern" }]
    },

    // Multiple forbidden patterns matched
    {
      code: "t`Hello&nbsp;&amp;World`",
      options: [{ forbiddenPatterns: ["&nbsp;", "&amp;"], minLength: null }],
      errors: [{ messageId: "forbiddenPattern" }, { messageId: "forbiddenPattern" }]
    },

    // Too short message
    {
      code: "t`Hi`",
      options: [{ forbiddenPatterns: [], minLength: 5 }],
      errors: [{ messageId: "tooShort" }]
    },
    {
      code: "t`X`",
      options: [{ forbiddenPatterns: [], minLength: 2 }],
      errors: [{ messageId: "tooShort" }]
    },

    // Too short JSX message
    {
      code: "<Trans>Hi</Trans>",
      options: [{ forbiddenPatterns: [], minLength: 5 }],
      errors: [{ messageId: "tooShort" }]
    },

    // Both forbidden pattern and too short
    {
      code: "t`X&`",
      options: [{ forbiddenPatterns: ["&"], minLength: 5 }],
      errors: [{ messageId: "forbiddenPattern" }, { messageId: "tooShort" }]
    },

    // Regex pattern
    {
      code: "t`Hello World!!!`",
      options: [{ forbiddenPatterns: ["!{2,}"], minLength: null }],
      errors: [{ messageId: "forbiddenPattern" }]
    }
  ]
})
