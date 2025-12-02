import { RuleTester } from "@typescript-eslint/rule-tester"
import { afterAll, describe, it } from "vitest"

import { noSingleTagMessage } from "./no-single-tag-message.js"

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

ruleTester.run("no-single-tag-message", noSingleTagMessage, {
  valid: [
    // Text before element
    "<Trans>Read <a href='/terms'>terms</a></Trans>",
    "<Trans>Click <button>here</button> to continue</Trans>",

    // Text after element
    "<Trans><a href='/terms'>Terms</a> and conditions</Trans>",

    // Text inside with element (has surrounding structure)
    "<Trans><strong>Important:</strong> Please read carefully</Trans>",

    // Multiple elements
    "<Trans><strong>Bold</strong> and <em>italic</em></Trans>",

    // Element with expression (mixed content)
    "<Trans><strong>Hello</strong> {name}</Trans>",

    // Only text, no elements
    "<Trans>Hello World</Trans>",

    // Only expression (handled by no-single-variable-message)
    "<Trans>{message}</Trans>",

    // Non-Trans elements are ignored
    "<div><a href='/link'>Link</a></div>",
    "<Plural><span>item</span></Plural>"
  ],
  invalid: [
    // Single anchor tag
    {
      code: "<Trans><a href='/terms'>Terms</a></Trans>",
      errors: [{ messageId: "singleTag" }]
    },
    // Single button
    {
      code: "<Trans><button>Click me</button></Trans>",
      errors: [{ messageId: "singleTag" }]
    },
    // Single strong tag
    {
      code: "<Trans><strong>Important</strong></Trans>",
      errors: [{ messageId: "singleTag" }]
    },
    // Single span with whitespace around
    {
      code: "<Trans>  <span>Text</span>  </Trans>",
      errors: [{ messageId: "singleTag" }]
    },
    // Nested element structure but still single top-level element
    {
      code: "<Trans><div><span>Nested</span></div></Trans>",
      errors: [{ messageId: "singleTag" }]
    },
    // Fragment as single child
    {
      code: "<Trans><><span>In fragment</span></></Trans>",
      errors: [{ messageId: "singleTag" }]
    }
  ]
})

