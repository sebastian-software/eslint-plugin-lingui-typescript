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

    // Inside t() function call with object syntax (not just tagged template)
    { code: 't({ message: "Hello World" })', filename: "test.tsx" },
    { code: 't({ message: "e.g., Philippe L.", context: "placeholder for full name field" })', filename: "test.tsx" },
    { code: 't({ id: "msg.hello", comment: "Greetings at homepage", message: "Hello World" })', filename: "test.tsx" },

    // Inside msg/defineMessage
    { code: 'msg({ message: "Hello World" })', filename: "test.tsx" },
    { code: 'defineMessage({ message: "Save changes" })', filename: "test.tsx" },

    // Inside i18n.t() and i18n._()
    { code: 'i18n.t({ message: "Hello World" })', filename: "test.tsx" },
    { code: 'i18n._("Save changes")', filename: "test.tsx" },

    // Console/debug (default ignored functions with wildcard)
    { code: 'console.log("Hello World")', filename: "test.tsx" },
    { code: 'console.error("Something went wrong")', filename: "test.tsx" },
    { code: 'console.warn("This is a warning")', filename: "test.tsx" },
    { code: 'console.info("Info message here")', filename: "test.tsx" },
    { code: 'console.debug("Debug output here")', filename: "test.tsx" },
    { code: 'console.trace("Trace message")', filename: "test.tsx" },

    // Error constructors (default ignored)
    { code: 'new Error("Something went wrong")', filename: "test.tsx" },
    { code: 'new TypeError("Invalid type provided")', filename: "test.tsx" },
    { code: 'throw new RangeError("Value out of range")', filename: "test.tsx" },

    // Custom ignored function with wildcard
    {
      code: 'myLogger.info("Log this message")',
      filename: "test.tsx",
      options: [{ ignoreFunctions: ["myLogger.*"], ignoreProperties: [], ignoreNames: [], ignorePattern: null }]
    },
    {
      code: 'context.headers.set("Authorization header")',
      filename: "test.tsx",
      options: [{ ignoreFunctions: ["*.headers.set"], ignoreProperties: [], ignoreNames: [], ignorePattern: null }]
    },

    // Ignored properties (className, type, etc.)
    { code: '<div className="my-class" />', filename: "test.tsx" },
    { code: '<input type="text" />', filename: "test.tsx" },
    { code: '<div id="my-id" />', filename: "test.tsx" },
    { code: '<div data-testid="test-button" />', filename: "test.tsx" },
    { code: '<a href="/path/to/page" />', filename: "test.tsx" },

    // Object properties with ignored keys
    { code: '({ type: "button" })', filename: "test.tsx" },
    { code: '({ className: "my-class" })', filename: "test.tsx" },

    // CSS class name properties (camelCase ending with Class or ClassName)
    { code: '<Button containerClassName="flex items-center" />', filename: "test.tsx" },
    { code: '<Input wrapperClassName="mt-4 mb-2" />', filename: "test.tsx" },
    { code: '<Card headerClass="text-lg font-bold" />', filename: "test.tsx" },
    { code: '<Modal overlayClass="bg-black opacity-50" />', filename: "test.tsx" },
    { code: '({ buttonClassName: "px-4 py-2" })', filename: "test.tsx" },
    { code: '({ inputClass: "border rounded" })', filename: "test.tsx" },
    // Complex camelCase class name properties
    { code: '<Select inputElementClassName="text-sm placeholder-gray-400" />', filename: "test.tsx" },
    { code: '<DatePicker calendarPopoverClassName="shadow-lg rounded-xl" />', filename: "test.tsx" },

    // Strings inside className utility functions (cn, clsx, classnames, etc.)
    { code: '<div className={cn("px-4 py-2", "text-white")} />', filename: "test.tsx" },
    { code: '<div className={clsx("base-class", condition && "conditional-class")} />', filename: "test.tsx" },
    { code: '<div className={classnames("a", "b", "c")} />', filename: "test.tsx" },
    { code: '<div className={twMerge("px-4", "px-8")} />', filename: "test.tsx" },
    { code: '<div className={condition ? "class-a" : "class-b"} />', filename: "test.tsx" },
    // Complex ternary in styling property
    {
      code: `<DatePicker
        buttonClassName={
          errors.date
            ? "border-red-500 focus-visible:ring-red-500 w-full"
            : "w-full dark:bg-slate-800"
        }
      />`,
      filename: "test.tsx"
    },
    {
      code: '<div className={cn("base", variant === "primary" ? "bg-blue-500" : "bg-gray-500")} />',
      filename: "test.tsx"
    },
    // Nested function calls
    { code: '<div className={cn(baseStyles, getVariantClass("primary"))} />', filename: "test.tsx" },

    // Nested objects inside styling properties (e.g., classNames prop with sub-properties)
    {
      code: `<DatePicker
        calendarProps={{
          className: "dark:bg-slate-800",
          classNames: {
            caption_label: "dark:text-slate-100",
            day: "dark:text-slate--300 dark:hover:bg-slate-700",
            nav_button: "dark:text-slate-400",
          },
        }}
      />`,
      filename: "test.tsx"
    },
    // classNames is in default ignore list (not a suffix pattern)
    { code: '<Calendar classNames={{ day: "bg-white", cell: "p-2" }} />', filename: "test.tsx" },
    // Color properties
    { code: '<Box backgroundColor="#ff0000" />', filename: "test.tsx" },
    { code: '<Text textColor="red-500" />', filename: "test.tsx" },
    { code: '<Button borderColor="gray.200" />', filename: "test.tsx" },
    { code: '({ accentColor: "blue" })', filename: "test.tsx" },
    // Style properties
    { code: '<View containerStyle="flex-1" />', filename: "test.tsx" },
    { code: '({ buttonStyle: "primary" })', filename: "test.tsx" },
    // Icon properties
    { code: '<Button leftIcon="arrow-left" />', filename: "test.tsx" },
    { code: '<Alert statusIcon="warning" />', filename: "test.tsx" },
    // Size properties
    { code: '<Text fontSize="lg" />', filename: "test.tsx" },
    { code: '<Avatar iconSize="24" />', filename: "test.tsx" },
    // Id properties
    { code: '<Section containerId="main-section" />', filename: "test.tsx" },
    { code: '({ elementId: "header" })', filename: "test.tsx" },
    // Image properties
    { code: '<Card backgroundImage="url(/bg.png)" />', filename: "test.tsx" },
    { code: '({ avatarImage: "user-default.svg" })', filename: "test.tsx" },

    // UPPER_CASE styling constants
    { code: 'const STATUS_COLORS = { active: "bg-green-100 text-green-800" }', filename: "test.tsx" },
    { code: 'const BUTTON_CLASSES = { primary: "px-4 py-2 rounded" }', filename: "test.tsx" },
    { code: 'const THEME_STYLES = { dark: "bg-gray-900 text-white" }', filename: "test.tsx" },
    { code: 'const NAV_ICONS = { home: "house-solid", settings: "gear-outline" }', filename: "test.tsx" },
    { code: 'const AVATAR_SIZES = { sm: "w-8 h-8", lg: "w-16 h-16" }', filename: "test.tsx" },
    { code: 'const CARD_IMAGES = { hero: "/images/hero.jpg" }', filename: "test.tsx" },
    { code: 'const ELEMENT_IDS = { header: "main-header", footer: "main-footer" }', filename: "test.tsx" },
    // Singular forms (UPPER_CASE)
    { code: 'const DEFAULT_COLOR = { value: "#ff0000" }', filename: "test.tsx" },
    { code: 'const MAIN_CLASS = { container: "mx-auto max-w-7xl" }', filename: "test.tsx" },
    // camelCase styling variables
    {
      code: 'const colorClasses = { Solar: "bg-orange-100 text-orange-800", Wind: "bg-blue-100" }',
      filename: "test.tsx"
    },
    {
      code: 'const buttonStyles = { primary: "px-4 py-2 bg-blue-500", secondary: "px-4 py-2 bg-gray-200" }',
      filename: "test.tsx"
    },
    { code: 'const statusColors = { active: "#00ff00", inactive: "#cccccc" }', filename: "test.tsx" },
    { code: 'const iconSizes = { sm: "w-4 h-4", lg: "w-8 h-8" }', filename: "test.tsx" },
    // Styling variable with cn() function call
    {
      code: `const indicatorClassName = cn(
        "shrink-0 rounded-[2px] border-border",
        { "h-2.5 w-2.5": indicator === "dot", "w-1": indicator === "line" }
      )`,
      filename: "test.tsx"
    },
    { code: 'const buttonClassName = cn("px-4 py-2", condition && "bg-blue-500")', filename: "test.tsx" },

    // Styling helper functions (function name indicates return value is styling)
    {
      code: `function getStatusColor(status: string) {
        switch (status) {
          case "active": return "bg-green-100 text-green-800";
          case "draft": return "bg-gray-100 text-gray-800";
          default: return "bg-muted text-muted-foreground";
        }
      }`,
      filename: "test.tsx"
    },
    {
      code: `const getButtonClass = (variant: string) => {
        return variant === "primary" ? "bg-blue-500 text-white" : "bg-gray-200";
      }`,
      filename: "test.tsx"
    },
    {
      code: 'function computeClassName(active: boolean) { return active ? "bg-green-500" : "bg-red-500" }',
      filename: "test.tsx"
    },
    { code: 'const getContainerStyle = () => "flex items-center justify-between"', filename: "test.tsx" },
    // Styling helper functions with nullable return types should still be ignored
    {
      code: `function getStatusColor(status: string): string | null {
        if (status === "unknown") return null;
        return "bg-green-100 text-green-800";
      }`,
      filename: "test.tsx"
    },
    {
      code: `const getButtonClass = (v: string): string | undefined => {
        return v ? "bg-blue-500 text-white" : undefined;
      }`,
      filename: "test.tsx"
    },
    // Nested objects should NOT be ignored (only direct property values)
    // These are in the invalid section below

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

    // Numeric/symbolic strings (no letters at all)
    { code: 'const x = "1000"', filename: "test.tsx" },
    { code: 'const x = "1.000"', filename: "test.tsx" },
    { code: 'const x = "1,00"', filename: "test.tsx" },
    { code: 'const x = "1,00€"', filename: "test.tsx" },
    { code: 'const x = "€100"', filename: "test.tsx" },
    { code: 'const x = "1,00 2,00 3,00"', filename: "test.tsx" },
    { code: 'const x = "100%"', filename: "test.tsx" },
    { code: 'const x = "$99.99"', filename: "test.tsx" },
    { code: 'const x = "12:30"', filename: "test.tsx" },
    { code: 'const x = "2024-01-15"', filename: "test.tsx" },
    { code: 'const x = "→ ← ↑ ↓"', filename: "test.tsx" },

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
    },

    // as const in arrays
    {
      code: 'const names = ["name" as const, "city" as const]',
      filename: "test.tsx"
    },

    // as const in objects
    {
      code: 'const sides = { top: "above" as const, bottom: "below" as const }',
      filename: "test.tsx"
    },

    // Template literals with only variables
    { code: "const t = `${BRAND_NAME}`", filename: "test.tsx" },
    { code: "const t = `${BRAND_NAME}${OTHER}`", filename: "test.tsx" },
    { code: "const t = ` ${X} ${Y} `", filename: "test.tsx" },

    // Tagged template expressions (styled-components, etc.)
    { code: 'styled.div`color: ${"red"};`', filename: "test.tsx" },
    { code: "styled.div`color: ${`red`};`", filename: "test.tsx" },

    // Switch case strings
    { code: 'switch(x) { case "hello": break; case `world`: break; }', filename: "test.tsx" },

    // SVG attributes
    { code: '<svg viewBox="0 0 20 40"></svg>', filename: "test.tsx" },
    { code: '<path d="M10 10" />', filename: "test.tsx" },
    { code: '<circle cx="10" cy="10" r="2" fill="red" />', filename: "test.tsx" },

    // Computed member expressions (object keys)
    { code: 'obj["key with spaces"] = value', filename: "test.tsx" },
    { code: 'const styles = { ":hover": { color: "red" } }', filename: "test.tsx" },

    // Import/Export paths
    { code: 'import name from "hello"', filename: "test.tsx" },
    { code: 'export * from "hello_export_all"', filename: "test.tsx" },

    // React directives
    { code: '"use client"', filename: "test.tsx" },
    { code: '"use server"', filename: "test.tsx" },
    { code: '"use client"\nimport React from "react"', filename: "test.tsx" },
    { code: '"use server"\nexport async function action() {}', filename: "test.tsx" },
    // "use server" inside function body (server actions)
    { code: 'async function myAction() { "use server"; return null }', filename: "test.tsx" },
    { code: 'const action = async () => { "use server"; return null }', filename: "test.tsx" },

    // =========================================================================
    // Branded types with __linguiIgnore
    // =========================================================================

    // UnlocalizedLog branded type
    {
      code: `
        type UnlocalizedLog = string & { readonly __linguiIgnore?: "UnlocalizedLog" }
        interface Logger {
          info(message: UnlocalizedLog): void
        }
        declare const logger: Logger
        logger.info("Starting server on port 3000")
      `,
      filename: "test.tsx"
    },

    // UnlocalizedStyle branded type
    {
      code: `
        type UnlocalizedStyle = string & { readonly __linguiIgnore?: "UnlocalizedStyle" }
        interface ThemeConfig {
          primaryColor: UnlocalizedStyle
          fontFamily: UnlocalizedStyle
        }
        const theme: ThemeConfig = {
          primaryColor: "#3b82f6",
          fontFamily: "Inter, sans-serif"
        }
      `,
      filename: "test.tsx"
    },

    // UnlocalizedClassName branded type
    {
      code: `
        type UnlocalizedClassName = string & { readonly __linguiIgnore?: "UnlocalizedClassName" }
        interface ButtonProps {
          className?: UnlocalizedClassName
        }
        function Button(props: ButtonProps) {}
        <Button className="px-4 py-2 bg-blue-500" />
      `,
      filename: "test.tsx"
    },

    // UnlocalizedText branded type (catch-all)
    {
      code: `
        type UnlocalizedText = string & { readonly __linguiIgnore?: "UnlocalizedText" }
        interface ApiConfig {
          endpoint: UnlocalizedText
        }
        const config: ApiConfig = {
          endpoint: "Users endpoint configuration"
        }
      `,
      filename: "test.tsx"
    },

    // UnlocalizedEvent branded type
    {
      code: `
        type UnlocalizedEvent = string & { readonly __linguiIgnore?: "UnlocalizedEvent" }
        interface Analytics {
          track(event: UnlocalizedEvent): void
        }
        declare const analytics: Analytics
        analytics.track("User Signed Up")
      `,
      filename: "test.tsx"
    },

    // UnlocalizedKey branded type
    {
      code: `
        type UnlocalizedKey = string & { readonly __linguiIgnore?: "UnlocalizedKey" }
        interface Storage {
          get(key: UnlocalizedKey): string | null
        }
        declare const storage: Storage
        storage.get("User Preferences")
      `,
      filename: "test.tsx"
    },

    // Branded type with function parameter
    {
      code: `
        type UnlocalizedLog = string & { readonly __linguiIgnore?: "UnlocalizedLog" }
        function log(msg: UnlocalizedLog) {}
        log("Application started successfully")
      `,
      filename: "test.tsx"
    },

    // Branded type with multiple methods (Logger pattern)
    {
      code: `
        type UnlocalizedLog = string & { readonly __linguiIgnore?: "UnlocalizedLog" }
        interface Logger {
          debug(message: UnlocalizedLog, ...args: unknown[]): void
          info(message: UnlocalizedLog, ...args: unknown[]): void
          warn(message: UnlocalizedLog, ...args: unknown[]): void
          error(message: UnlocalizedLog, ...args: unknown[]): void
        }
        declare const logger: Logger
        logger.debug("Debug information here")
        logger.info("Processing request now")
        logger.warn("This might be problematic")
        logger.error("Something went wrong!")
      `,
      filename: "test.tsx"
    },

    // UnlocalizedFunction<T> - wrap entire logger interface
    {
      code: `
        type UnlocalizedFunction<T> = T & { readonly __linguiIgnoreArgs?: true }
        interface Logger {
          info(...args: unknown[]): void
          debug(...args: unknown[]): void
        }
        declare const logger: UnlocalizedFunction<Logger>
        logger.info("Server started on port", 3000)
        logger.info("Request received")
        logger.debug({ complex: "object" }, "with message")
      `,
      filename: "test.tsx"
    },

    // UnlocalizedFunction<T> - with factory function return type
    {
      code: `
        type UnlocalizedFunction<T> = T & { readonly __linguiIgnoreArgs?: true }
        interface Logger {
          info(...args: unknown[]): void
          warn(...args: unknown[]): void
          error(...args: unknown[]): void
        }
        declare function createLogger(): UnlocalizedFunction<Logger>
        const logger = createLogger()
        logger.info("Application started successfully")
        logger.warn("This might be a problem")
        logger.error("Something went wrong!")
      `,
      filename: "test.tsx"
    },

    // UnlocalizedFunction<T> - direct function
    {
      code: `
        type UnlocalizedFunction<T> = T & { readonly __linguiIgnoreArgs?: true }
        type LogFn = (...args: unknown[]) => void
        declare const log: UnlocalizedFunction<LogFn>
        log("Direct function call ignored")
      `,
      filename: "test.tsx"
    },

    // unlocalized() helper function
    {
      code: `
        type UnlocalizedFunction<T> = T & { readonly __linguiIgnoreArgs?: true }
        function unlocalized<T>(value: T): UnlocalizedFunction<T> { return value }
        function createLogger() {
          return unlocalized({
            info: (...args: unknown[]) => console.info(...args),
            error: (...args: unknown[]) => console.error(...args),
          })
        }
        const logger = createLogger()
        logger.info("Server started successfully")
        logger.error("Connection failed!")
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
    },

    // Non-Latin: Japanese
    {
      code: 'const a = "こんにちは"',
      filename: "test.tsx",
      errors: [{ messageId: "unlocalizedString" }]
    },

    // Non-Latin: Cyrillic (Russian)
    {
      code: 'const a = "Привет"',
      filename: "test.tsx",
      errors: [{ messageId: "unlocalizedString" }]
    },

    // Non-Latin: Chinese
    {
      code: 'const a = "添加筛选器"',
      filename: "test.tsx",
      errors: [{ messageId: "unlocalizedString" }]
    },

    // Non-Latin: Korean
    {
      code: 'const a = "안녕하세요"',
      filename: "test.tsx",
      errors: [{ messageId: "unlocalizedString" }]
    },

    // Non-Latin: Arabic
    {
      code: 'const a = "مرحبا"',
      filename: "test.tsx",
      errors: [{ messageId: "unlocalizedString" }]
    },

    // JSX with Non-Latin text
    {
      code: "<button>保存</button>",
      filename: "test.tsx",
      errors: [{ messageId: "unlocalizedString" }]
    },

    // Strings inside exported functions (bug fix: should be flagged)
    {
      code: 'export function testAction() { const message = "Failed to check preferences"; return message; }',
      filename: "test.tsx",
      errors: [{ messageId: "unlocalizedString" }]
    },
    {
      code: 'export async function testAction() { const message = "Failed to check preferences"; return message; }',
      filename: "test.tsx",
      errors: [{ messageId: "unlocalizedString" }]
    },
    {
      code: `
        export async function checkPreferenceExistsAction(companyId: string) {
          try {
            return { success: true };
          } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to check preferences";
            return { success: false, error: message };
          }
        }
      `,
      filename: "test.tsx",
      errors: [{ messageId: "unlocalizedString" }]
    },
    {
      code: 'export const testAction = () => { return "Something went wrong!" }',
      filename: "test.tsx",
      errors: [{ messageId: "unlocalizedString" }]
    },

    // Styling constants: only DIRECT property values are ignored
    // Functions, IIFEs, nested objects, etc. should still be flagged
    {
      code: 'const STATUS_COLORS = { active: (() => "Hello World")() }',
      filename: "test.tsx",
      errors: [{ messageId: "unlocalizedString" }]
    },
    {
      code: 'const STATUS_COLORS = { active: fn("Hello World") }',
      filename: "test.tsx",
      errors: [{ messageId: "unlocalizedString" }]
    },
    {
      code: 'const STATUS_COLORS = { active: { nested: "Hello World" } }',
      filename: "test.tsx",
      errors: [{ messageId: "unlocalizedString" }]
    },

    // Strings inside callbacks should NOT be ignored (even when className is present)
    {
      code: '<button className="px-4" onClick={() => alert("Hello World")}>X</button>',
      filename: "test.tsx",
      errors: [{ messageId: "unlocalizedString" }]
    },
    {
      code: '<button className={cn("px-4")} onSubmit={() => showMessage("Form submitted!")}>X</button>',
      filename: "test.tsx",
      errors: [{ messageId: "unlocalizedString" }]
    },

    // Styling helper functions with non-string return types should NOT be ignored
    {
      // Function returns object, not string - should be flagged
      code: `function getStatusColor(status: string): { color: string; label: string } {
        return { color: "bg-green-100", label: "Hello World" };
      }`,
      filename: "test.tsx",
      errors: [{ messageId: "unlocalizedString" }]
    },
    {
      // Function returns array, not string - should be flagged
      code: `const getButtonClass = (v: string): string[] => {
        return ["Hello World", "bg-blue-500"];
      }`,
      filename: "test.tsx",
      errors: [{ messageId: "unlocalizedString" }]
    },

    // Branded types without __linguiIgnore should still be flagged
    {
      code: `
        type CustomString = string & { readonly __custom?: "test" }
        function test(msg: CustomString) {}
        test("Hello World")
      `,
      filename: "test.tsx",
      errors: [{ messageId: "unlocalizedString" }]
    }
  ]
})
