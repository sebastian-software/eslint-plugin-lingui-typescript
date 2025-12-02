import { RuleTester } from "@typescript-eslint/rule-tester"
import { afterAll, describe, it } from "vitest"

import { validTCallLocation } from "./valid-t-call-location.js"

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

ruleTester.run("valid-t-call-location", validTCallLocation, {
  valid: [
    // Inside function declaration
    `function Component() {
      const msg = t\`Hello\`
      return msg
    }`,

    // Inside arrow function
    `const Component = () => {
      const msg = t\`Hello\`
      return msg
    }`,

    // Inside function expression
    `const getMsg = function() {
      return t\`Hello\`
    }`,

    // Inside method
    `class MyClass {
      getMessage() {
        return t\`Hello\`
      }
    }`,

    // Inside React component
    `function App() {
      return <div>{t\`Welcome\`}</div>
    }`,

    // Inside callback
    `items.map(() => t\`Item\`)`,

    // Inside event handler
    `function Component() {
      const handleClick = () => {
        alert(t\`Clicked\`)
      }
    }`,

    // Inside hook
    `function useTranslation() {
      return { message: t\`Hello\` }
    }`,

    // Non-t tagged templates at top level are fine
    `const styles = css\`color: red\``,
    `const html = html\`<div></div>\``,

    // Allow top level when configured
    {
      code: `const msg = t\`Hello\``,
      options: [{ allowTopLevel: true }]
    }
  ],
  invalid: [
    // Top-level variable declaration
    {
      code: `const msg = t\`Hello\``,
      errors: [{ messageId: "topLevelNotAllowed" }]
    },

    // Top-level export
    {
      code: `export const msg = t\`Welcome\``,
      errors: [{ messageId: "topLevelNotAllowed" }]
    },

    // Multiple top-level usages
    {
      code: `
        const greeting = t\`Hello\`
        const farewell = t\`Goodbye\`
      `,
      errors: [{ messageId: "topLevelNotAllowed" }, { messageId: "topLevelNotAllowed" }]
    },

    // Inside class property (not method)
    {
      code: `
        class MyClass {
          message = t\`Hello\`
        }
      `,
      errors: [{ messageId: "topLevelNotAllowed" }]
    },

    // Inside object at top level
    {
      code: `
        const config = {
          message: t\`Hello\`
        }
      `,
      errors: [{ messageId: "topLevelNotAllowed" }]
    }
  ]
})
