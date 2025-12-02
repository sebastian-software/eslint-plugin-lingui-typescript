import { RuleTester } from "@typescript-eslint/rule-tester"
import { afterAll, describe, it } from "vitest"

import { noUnlocalizedStrings } from "./no-unlocalized-strings.js"

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

ruleTester.run("no-unlocalized-strings", noUnlocalizedStrings, {
  valid: [
    // Inside t``
    "t`Hello World`",
    "t`Save changes`",

    // Inside <Trans>
    "<Trans>Hello World</Trans>",
    "<Trans>Save changes</Trans>",

    // Inside msg/defineMessage
    'msg({ message: "Hello World" })',
    'defineMessage({ message: "Save changes" })',

    // Console/debug (default ignored functions)
    'console.log("Hello World")',
    'console.error("Something went wrong")',

    // Ignored properties (className, type, etc.)
    '<div className="my-class" />',
    '<input type="text" />',
    '<div id="my-id" />',
    '<div data-testid="test-button" />',
    '<a href="/path/to/page" />',

    // Object properties with ignored keys
    '({ type: "button" })',
    '({ className: "my-class" })',

    // Technical strings (no spaces, identifiers)
    'const x = "myIdentifier"',
    'const x = "my-css-class"',
    'const x = "CONSTANT_VALUE"',

    // URLs and paths
    'const url = "https://example.com"',
    'const path = "/api/users"',
    'const mailto = "mailto:test@example.com"',

    // Single characters
    'const sep = "-"',
    'const x = "."',

    // Empty strings
    'const x = ""',
    'const x = "   "',

    // Type contexts
    'type Status = "loading" | "error"',
    "interface Props { variant: 'primary' | 'secondary' }",

    // Ignore pattern
    {
      code: 'const x = "test_id_123"',
      options: [{ ignoreFunctions: [], ignoreProperties: [], ignoreNames: [], ignorePattern: "^test_" }]
    },

    // Non-UI looking text
    'const x = "myFunction"',
    'const x = "onClick"'
  ],
  invalid: [
    // Plain string that looks like UI text
    {
      code: 'const label = "Save changes"',
      errors: [{ messageId: "unlocalizedString" }]
    },
    {
      code: 'const msg = "Something went wrong!"',
      errors: [{ messageId: "unlocalizedString" }]
    },
    {
      code: 'const title = "Welcome to the app"',
      errors: [{ messageId: "unlocalizedString" }]
    },

    // JSX text
    {
      code: "<button>Save changes</button>",
      errors: [{ messageId: "unlocalizedString" }]
    },
    {
      code: "<div>Something went wrong!</div>",
      errors: [{ messageId: "unlocalizedString" }]
    },
    {
      code: "<p>Please try again.</p>",
      errors: [{ messageId: "unlocalizedString" }]
    },

    // JSX with title/aria-label that's not in default ignore list
    {
      code: '<button title="Click here">X</button>',
      errors: [{ messageId: "unlocalizedString" }]
    },

    // Multiple violations
    {
      code: `
        const a = "Hello World"
        const b = "Goodbye World"
      `,
      errors: [
        { messageId: "unlocalizedString" },
        { messageId: "unlocalizedString" }
      ]
    },

    // Function return value
    {
      code: 'function getLabel() { return "Click me" }',
      errors: [{ messageId: "unlocalizedString" }]
    },

    // Object property (non-ignored key)
    {
      code: '({ label: "Save changes" })',
      errors: [{ messageId: "unlocalizedString" }]
    },
    {
      code: '({ message: "Error occurred!" })',
      errors: [{ messageId: "unlocalizedString" }]
    }
  ]
})

