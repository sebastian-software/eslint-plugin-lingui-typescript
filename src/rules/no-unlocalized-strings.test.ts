import { RuleTester } from "@typescript-eslint/rule-tester"
import { afterAll, describe, it } from "vitest"

import { noUnlocalizedStrings } from "./no-unlocalized-strings.js"

RuleTester.afterAll = afterAll
RuleTester.describe = describe
RuleTester.it = it

const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      projectService: {
        allowDefaultProject: ["*.ts", "*.tsx"]
      },
      tsconfigRootDir: import.meta.dirname
    }
  }
})

ruleTester.run("no-unlocalized-strings", noUnlocalizedStrings, {
  valid: [
    // Inside t``
    { code: "t`Hello World`", filename: "test.tsx" },
    { code: "t`Save changes`", filename: "test.tsx" },

    // Inside plural(), select(), selectOrdinal()
    { code: "plural(count, { one: 'One item', other: '# items' })", filename: "test.tsx" },
    {
      code: "select(gender, { male: 'He likes it', female: 'She likes it', other: 'They like it' })",
      filename: "test.tsx"
    },
    { code: "selectOrdinal(pos, { one: '#st place', two: '#nd place', other: '#th place' })", filename: "test.tsx" },

    // Inside <Trans>
    { code: "<Trans>Hello World</Trans>", filename: "test.tsx" },
    { code: "<Trans>Save changes</Trans>", filename: "test.tsx" },

    // Inside <Plural>, <Select>, <SelectOrdinal>
    { code: '<Plural value={count} one="One item" other="# items" />', filename: "test.tsx" },
    { code: '<Select value={gender} male="He" female="She" other="They" />', filename: "test.tsx" },
    { code: '<SelectOrdinal value={pos} one="#st" two="#nd" few="#rd" other="#th" />', filename: "test.tsx" },

    // Inside msg/defineMessage
    { code: 'msg({ message: "Hello World" })', filename: "test.tsx" },
    { code: 'defineMessage({ message: "Save changes" })', filename: "test.tsx" },

    // Inside i18n.t() and i18n._()
    { code: 'i18n.t({ message: "Hello World" })', filename: "test.tsx" },
    { code: 'i18n._("Save changes")', filename: "test.tsx" },

    // Console/debug (default ignored functions)
    { code: 'console.log("Hello World")', filename: "test.tsx" },
    { code: 'console.error("Something went wrong")', filename: "test.tsx" },

    // Ignored properties (className, type, etc.)
    { code: '<div className="my-class" />', filename: "test.tsx" },
    { code: '<input type="text" />', filename: "test.tsx" },
    { code: '<div id="my-id" />', filename: "test.tsx" },
    { code: '<div data-testid="test-button" />', filename: "test.tsx" },
    { code: '<a href="/path/to/page" />', filename: "test.tsx" },

    // Object properties with ignored keys
    { code: '({ type: "button" })', filename: "test.tsx" },
    { code: '({ className: "my-class" })', filename: "test.tsx" },

    // Technical strings (no spaces, identifiers)
    { code: 'const x = "myIdentifier"', filename: "test.tsx" },
    { code: 'const x = "my-css-class"', filename: "test.tsx" },
    { code: 'const x = "CONSTANT_VALUE"', filename: "test.tsx" },

    // URLs and paths
    { code: 'const url = "https://example.com"', filename: "test.tsx" },
    { code: 'const path = "/api/users"', filename: "test.tsx" },
    { code: 'const mailto = "mailto:test@example.com"', filename: "test.tsx" },

    // Single characters
    { code: 'const sep = "-"', filename: "test.tsx" },
    { code: 'const x = "."', filename: "test.tsx" },

    // Empty strings
    { code: 'const x = ""', filename: "test.tsx" },
    { code: 'const x = "   "', filename: "test.tsx" },

    // Type contexts
    { code: 'type Status = "loading" | "error"', filename: "test.tsx" },
    { code: "interface Props { variant: 'primary' | 'secondary' }", filename: "test.tsx" },

    // Ignore pattern
    {
      code: 'const x = "test_id_123"',
      filename: "test.tsx",
      options: [{ ignoreFunctions: [], ignoreProperties: [], ignoreNames: [], ignorePattern: "^test_" }]
    },

    // Non-UI looking text
    { code: 'const x = "myFunction"', filename: "test.tsx" },
    { code: 'const x = "onClick"', filename: "test.tsx" },

    // TypeScript: String literal union types are recognized as technical
    {
      code: `
        type Align = "left" | "center" | "right"
        const align: Align = "center"
      `,
      filename: "test.tsx"
    },
    {
      code: `
        function setMode(mode: "dark" | "light") {}
        setMode("dark")
      `,
      filename: "test.tsx"
    },

    // TypeScript: String literal unions with undefined/null
    {
      code: `
        type OptionalStatus = "loading" | "error" | undefined
        const status: OptionalStatus = "loading"
      `,
      filename: "test.tsx"
    },
    {
      code: `
        type NullableMode = "dark" | "light" | null
        const mode: NullableMode = "dark"
      `,
      filename: "test.tsx"
    },
    {
      code: `
        function setVariant(v: "primary" | "secondary" | undefined) {}
        setVariant("primary")
      `,
      filename: "test.tsx"
    },

    // TypeScript: String literal unions with numbers/booleans
    {
      code: `
        type MixedUnion = "auto" | "manual" | 0 | 1
        const value: MixedUnion = "auto"
      `,
      filename: "test.tsx"
    },
    {
      code: `
        type StateOrBool = "pending" | "done" | boolean
        const state: StateOrBool = "pending"
      `,
      filename: "test.tsx"
    },

    // TypeScript: useState with generic type parameter
    {
      code: `
        type Status = "idle" | "loading" | "error"
        declare function useState<T>(initial: T): [T, (v: T) => void]
        const [status, setStatus] = useState<Status>("idle")
      `,
      filename: "test.tsx"
    },

    // TypeScript: as const assertion
    {
      code: `
        const ACTION_SAVE = "save" as const
      `,
      filename: "test.tsx"
    },

    // TypeScript: Discriminated union assignment
    {
      code: `
        type Action = { type: "save" } | { type: "cancel" }
        const action: Action = { type: "save" }
      `,
      filename: "test.tsx"
    }
  ],
  invalid: [
    // Plain string that looks like UI text
    {
      code: 'const label = "Save changes"',
      filename: "test.tsx",
      errors: [{ messageId: "unlocalizedString" }]
    },
    {
      code: 'const msg = "Something went wrong!"',
      filename: "test.tsx",
      errors: [{ messageId: "unlocalizedString" }]
    },
    {
      code: 'const title = "Welcome to the app"',
      filename: "test.tsx",
      errors: [{ messageId: "unlocalizedString" }]
    },

    // JSX text
    {
      code: "<button>Save changes</button>",
      filename: "test.tsx",
      errors: [{ messageId: "unlocalizedString" }]
    },
    {
      code: "<div>Something went wrong!</div>",
      filename: "test.tsx",
      errors: [{ messageId: "unlocalizedString" }]
    },
    {
      code: "<p>Please try again.</p>",
      filename: "test.tsx",
      errors: [{ messageId: "unlocalizedString" }]
    },

    // JSX with title (not in default ignore list)
    {
      code: '<button title="Click here">X</button>',
      filename: "test.tsx",
      errors: [{ messageId: "unlocalizedString" }]
    },

    // Multiple violations
    {
      code: `
        const a = "Hello World"
        const b = "Goodbye World"
      `,
      filename: "test.tsx",
      errors: [{ messageId: "unlocalizedString" }, { messageId: "unlocalizedString" }]
    },

    // Function return value
    {
      code: 'function getLabel() { return "Click me" }',
      filename: "test.tsx",
      errors: [{ messageId: "unlocalizedString" }]
    },

    // Object property (non-ignored key)
    {
      code: '({ label: "Save changes" })',
      filename: "test.tsx",
      errors: [{ messageId: "unlocalizedString" }]
    },
    {
      code: '({ message: "Error occurred!" })',
      filename: "test.tsx",
      errors: [{ messageId: "unlocalizedString" }]
    }
  ]
})
