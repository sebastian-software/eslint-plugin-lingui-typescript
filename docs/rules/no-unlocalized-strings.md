# no-unlocalized-strings

Detect user-visible strings not wrapped in Lingui translation macros.

**This rule requires TypeScript type information.**

## Why?

Unlocalized strings can lead to:

- Incomplete translations
- Poor user experience for non-English speakers
- Difficulty tracking what needs translation

This rule uses TypeScript's type system to intelligently distinguish between user-visible text and technical strings — no manual whitelisting needed for most cases.

## Rule Details

This rule reports string literals, template literals, and JSX text that appear to be user-visible UI text but are not wrapped in Lingui translation macros.

### ❌ Invalid

```tsx
// Plain strings that look like UI text
const label = "Save changes"
const msg = "Something went wrong!"

// JSX text
<button>Save changes</button>
<p>Please try again.</p>

// Template literals with UI text
const msg = `Tool ${toolId} not found`
const question = `Are you sure you want to delete ${name}?`

// Object properties with UI text
{ label: "Click here" }
{ message: "Error occurred!" }
```

### ✅ Valid

```tsx
// Wrapped in Lingui macros
t`Save changes`
<Trans>Something went wrong!</Trans>
msg({ message: "Click here" })

// Technical/ignored strings
<div className="my-class" />
<input type="text" />
console.log("Debug message")

// Template literals with only variables or technical content
const t = `${BRAND_NAME}`
const url = `https://example.com/${path}`

// Technical identifiers
const x = "myIdentifier"
const x = "CONSTANT_VALUE"

// URLs and paths
const url = "https://example.com"
const path = "/api/users"

// TypeScript union types (automatically detected)
type Status = "idle" | "loading" | "error"
const [status, setStatus] = useState<Status>("idle")

// Intl methods (type-aware detection)
date.toLocaleDateString("de-DE", { weekday: "long" })
new Intl.DateTimeFormat("en", { dateStyle: "full" })
```

## TypeScript Type-Aware Detection

This rule leverages TypeScript's type system to automatically detect technical strings:

### String Literal Unions

```tsx
type Variant = "primary" | "secondary" | "danger"
const variant: Variant = "primary"  // ✅ Not reported

function setAlign(align: "left" | "center" | "right") {}
setAlign("center")  // ✅ Not reported
```

### DOM APIs

```tsx
// All DOM string literal unions are automatically detected
document.createElement("div")                          // ✅ keyof HTMLElementTagNameMap
element.addEventListener("click", handler)             // ✅ keyof GlobalEventHandlersEventMap
fetch(url, { mode: "cors", credentials: "include" })   // ✅ RequestMode, RequestCredentials
element.scrollIntoView({ behavior: "smooth" })         // ✅ ScrollBehavior
```

### Intl-Related Types

```tsx
// Intl.LocalesArgument, DateTimeFormatOptions, etc.
date.toLocaleDateString("de-DE", { weekday: "long" })  // ✅ Not reported
new Intl.NumberFormat("en-US", { style: "currency" })  // ✅ Not reported
```

### Discriminated Unions

```tsx
const action = { type: "save" }  // ✅ Not reported (type/kind properties)
```

## Options

### `ignoreFunctions`

Array of function names whose string arguments should be ignored. Supports wildcards.

Default: `["require", "import"]`

Most common cases are detected automatically via TypeScript types:
- **Console methods** (`console.log`, `console.error`, etc.) — detected via `Console` type
- **Error constructors** (`new Error()`, `new TypeError()`, etc.) — detected via Error type hierarchy

```ts
{
  "lingui-ts/no-unlocalized-strings": ["error", {
    "ignoreFunctions": ["require", "import", "logger.*", "analytics.track"]
  }]
}
```

Wildcard examples:

- `"logger.*"` matches `logger.debug`, `logger.info`, etc.
- `"*.track"` matches `analytics.track`, `events.track`, etc.

### `ignoreProperties`

Array of property/attribute names whose string values should be ignored.

This list is intentionally minimal — most HTML/SVG attributes are detected automatically via TypeScript types (string literal unions like `"button" | "submit"` for `type`).

Default:

```ts
[
  "className",    // CSS classes - arbitrary strings, always technical
  "classNames",   // CSS classes object (e.g., for component libraries)
  "key",          // React key prop
  "data-testid"   // DOM Testing Library standard
]
```

```ts
{
  "lingui-ts/no-unlocalized-strings": ["error", {
    "ignoreProperties": ["className", "testId", "myCustomTechnicalProp"]
  }]
}
```

**Note**: Properties like `type`, `role`, `href`, `id` are NOT in the default list because TypeScript automatically detects them as technical when they have string literal union types.

#### Auto-Detected Styling Properties

In addition to the explicit list, the rule automatically ignores camelCase properties ending with common styling suffixes:

| Suffix | Examples |
|--------|----------|
| `ClassName` | `containerClassName`, `wrapperClassName` |
| `Class` | `buttonClass`, `inputClass` |
| `Color` | `backgroundColor`, `borderColor` |
| `Style` | `containerStyle`, `buttonStyle` |
| `Icon` | `leftIcon`, `statusIcon` |
| `Image` | `backgroundImage`, `avatarImage` |
| `Size` | `fontSize`, `iconSize` |
| `Id` | `containerId`, `elementId` |

```tsx
// All automatically ignored - no configuration needed
<Button containerClassName="flex items-center" />
<Input wrapperClassName="mt-4" />
<Box backgroundColor="#ff0000" />
<Card backgroundImage="url(/hero.jpg)" />
<Avatar iconSize="24" />

// Also works with className utility functions (cn, clsx, classnames, etc.)
<div className={cn("px-4 py-2", "text-white")} />
<div className={clsx("base", condition && "extra")} />
<div className={condition ? "class-a" : "class-b"} />

// Nested classNames objects are fully supported
<Calendar
  classNames={{
    day: "bg-white text-gray-900",
    cell: "p-2 hover:bg-gray-100",
  }}
/>
```

This covers common patterns in component libraries like Chakra UI, Material UI, react-day-picker, and custom component props.

**Note**: Strings inside callback functions (like `onClick`) are NOT ignored, even when `className` is present on the same element.

#### Auto-Detected Styling Variables

Variable names (both UPPER_CASE and camelCase) with styling-related suffixes are automatically ignored:

**camelCase variables** (for object mappings):

| Suffix | Examples |
|--------|----------|
| `Classes`, `ClassName`, `ClassNames` | `colorClasses`, `buttonClassNames` |
| `Colors` | `statusColors`, `themeColors` |
| `Styles` | `buttonStyles`, `cardStyles` |
| `Icons` | `navIcons`, `statusIcons` |
| `Images` | `heroImages`, `avatarImages` |
| `Sizes` | `iconSizes`, `fontSizes` |
| `Ids` | `elementIds`, `sectionIds` |

```tsx
// camelCase variables with styling suffixes
const colorClasses = {
  Solar: "bg-orange-100 text-orange-800",
  Wind: "bg-blue-100 text-blue-800",
}

const buttonStyles = {
  primary: "px-4 py-2 bg-blue-500",
  secondary: "px-4 py-2 bg-gray-200",
}
```

**Styling helper functions** (singular suffixes for return values):

| Suffix | Examples |
|--------|----------|
| `Class`, `ClassName` | `getButtonClass`, `computeClassName` |
| `Color` | `getStatusColor`, `computeBackgroundColor` |
| `Style` | `getContainerStyle` |
| `Icon`, `Image`, `Size`, `Id` | `getAvatarIcon`, `computeFontSize` |

```tsx
// Helper functions with styling names - all return values ignored
function getStatusColor(status: string) {
  switch (status) {
    case "active": return "bg-green-100 text-green-800";
    case "draft": return "bg-gray-100 text-gray-800";
    default: return "bg-muted text-muted-foreground";
  }
}

// Used in className - the rule understands this pattern
<Badge className={getStatusColor(goal.status)}>
```

**Return type verification**: The rule uses TypeScript to verify that these functions actually return `string` (or `string | null | undefined`). Functions that return objects, arrays, or other types are NOT auto-ignored, even if they have a styling name:

```tsx
// ❌ FLAGGED - returns object, not string
function getStatusColor(status: string): { color: string; label: string } {
  return { color: "bg-green-100", label: "Hello World" };  // "Hello World" flagged
}

// ❌ FLAGGED - returns array, not string
const getButtonClass = (v: string): string[] => {
  return ["Hello World", "bg-blue-500"];  // "Hello World" flagged
}

// ✅ IGNORED - returns string
function getStatusColor(status: string): string {
  return "bg-green-100 text-green-800";
}

// ✅ IGNORED - returns string | null
function getStatusColor(status: string): string | null {
  if (status === "unknown") return null;
  return "bg-green-100 text-green-800";
}
```

**UPPER_CASE constants**:

| Suffix | Examples |
|--------|----------|
| `_CLASS`, `_CLASSES`, `_CLASSNAME`, `_CLASSNAMES` | `BUTTON_CLASSES`, `CARD_CLASSNAME` |
| `_COLOR`, `_COLORS` | `STATUS_COLORS`, `THEME_COLOR` |
| `_STYLE`, `_STYLES` | `CARD_STYLES`, `INPUT_STYLE` |
| `_ICON`, `_ICONS` | `NAV_ICONS`, `STATUS_ICON` |
| `_IMAGE`, `_IMAGES` | `HERO_IMAGES`, `CARD_IMAGE` |
| `_SIZE`, `_SIZES` | `AVATAR_SIZES`, `FONT_SIZE` |
| `_ID`, `_IDS` | `ELEMENT_IDS`, `SECTION_ID` |

```tsx
// All string values inside these constants are automatically ignored
const STATUS_COLORS = {
  active: "bg-green-100 text-green-800",
  error: "bg-red-100 text-red-800",
}

const BUTTON_CLASSES = {
  primary: "px-4 py-2 bg-blue-500 text-white rounded",
  secondary: "px-4 py-2 bg-gray-200 text-gray-800 rounded",
}
```

This is useful for Tailwind CSS class mappings and similar styling configuration objects.

### `ignoreNames`

Array of variable names to ignore.

Default: `["__DEV__", "NODE_ENV"]`

### `ignorePattern`

Regex pattern for strings to ignore.

Default: `null`

```ts
{
  "lingui-ts/no-unlocalized-strings": ["error", {
    "ignorePattern": "^(test_|mock_|__)"
  }]
}
```

### `reportUnnecessaryBrands`

Reports when a branded type (e.g., `UnlocalizedText`, `UnlocalizedLog`) is unnecessary because the string would not be flagged anyway.

Default: `false`

As the plugin improves with new heuristics (e.g., binary comparison detection, console method detection), some branded types become redundant. Enable this option to find and clean up unnecessary brands.

```ts
{
  "lingui-ts/no-unlocalized-strings": ["error", {
    "reportUnnecessaryBrands": true
  }]
}
```

```tsx
// ❌ Unnecessary brand — console.log is auto-detected
type UnlocalizedLog = string & { readonly __linguiIgnore?: "UnlocalizedLog" }
console.log("Hello World" as UnlocalizedLog)

// ❌ Unnecessary brand — binary comparison is auto-detected
type UnlocalizedText = string & { readonly __linguiIgnore?: "UnlocalizedText" }
if (status === ("Hello World" as UnlocalizedText)) {}

// ✅ Brand is needed — string would be reported without it
declare function log(msg: UnlocalizedText): void
log("Starting server on port 3000")
```

When the unnecessary brand is an explicit type assertion (`as UnlocalizedText` or `<UnlocalizedText>`), the rule offers an ESLint **suggestion** to remove the assertion. Suggestions appear as IDE quick-actions that you apply manually — they are not auto-applied via `--fix` because removing a type assertion could cause TypeScript compilation errors in the surrounding context.

**Note:** This option only checks string literals. It does not check template literals or JSX text (branded types don't apply there). For contextual brands (Record types, function parameters), no suggestion is offered because the brand lives on the type declaration, not on the literal.

## Heuristics

The rule uses heuristics to determine if a string looks like UI text:

**Reported as potential UI text:**

- Contains letters and spaces (e.g., "Save changes")
- Starts with uppercase followed by lowercase (e.g., "Hello")
- Contains punctuation like `.!?:,`
- Contains non-Latin scripts (CJK, Cyrillic, Arabic, etc.)

**Not reported (likely technical):**

- Empty or whitespace only
- Single characters
- ALL_CAPS_WITH_UNDERSCORES
- URLs and paths (`/`, `https://`, `mailto:`)
- Identifiers without spaces (`myFunction`, `my-css-class`)
- CSS selectors (`:hover`, `.class`, `#id`)
- SVG path data (`M10 10`, `L20 30`)
- Strings without any letters — numeric/symbolic only
- Strings used in comparisons (`===`, `!==`, `==`, `!=`, `<`, `>`, `<=`, `>=`)

### Comparison Strings

Strings used in binary comparisons are automatically ignored — localized strings would never be compared directly:

```tsx
// All automatically ignored
if (typeof x === "undefined") {}
typeof handler !== "function"
if (status === "active") {}
if (mode !== "dark") {}
value == "pending"
```

### Numeric and Symbolic Strings

Strings containing only numbers, punctuation, and symbols are automatically ignored:

```tsx
// All automatically ignored - no letters means no UI text
const price = "1,00€"
const amount = "$99.99"
const time = "12:30"
const date = "2024-01-15"
const percentage = "100%"
const list = "1,00 2,00 3,00"
const arrows = "→ ← ↑ ↓"
```

This uses Unicode letter detection (`\p{L}`), so accented characters like `ä`, `ö`, `ü`, `é` are correctly recognized as letters.

## Branded Types

This plugin exports branded types that you can use to mark parameters or properties as "no translation needed". The rule automatically detects these types and ignores strings passed to them.

### Installation

Import the types from the plugin:

```ts
import type {
  UnlocalizedFunction,
  UnlocalizedText,
  UnlocalizedLog,
  UnlocalizedStyle,
  UnlocalizedClassName,
  UnlocalizedEvent,
  UnlocalizedKey,
} from "eslint-plugin-lingui-typescript/types"
```

### Available Types

| Type | Use Case |
|------|----------|
| `UnlocalizedFunction<T>` | Wrap entire function/object to ignore all string arguments |
| `UnlocalizedText` | Generic catch-all for technical strings |
| `UnlocalizedLog` | Logger message parameters (string only) |
| `UnlocalizedStyle` | Style values (colors, fonts, spacing) |
| `UnlocalizedClassName` | CSS class name strings |
| `UnlocalizedEvent` | Analytics/tracking event names |
| `UnlocalizedKey` | Storage keys, query keys, identifiers |

### Example: Custom Logger (Recommended)

Use the `unlocalized()` helper function to wrap logger objects. This is the most flexible approach - all string arguments to any method are automatically ignored, and TypeScript infers the type automatically.

```ts
import { unlocalized } from "eslint-plugin-lingui-typescript/types"

function createLogger(prefix = "[App]") {
  return unlocalized({
    debug: (...args: unknown[]) => console.debug(prefix, ...args),
    info: (...args: unknown[]) => console.info(prefix, ...args),
    warn: (...args: unknown[]) => console.warn(prefix, ...args),
    error: (...args: unknown[]) => console.error(prefix, ...args),
  })
}

// Automatically typed - no manual type annotation needed!
const logger = createLogger()

// All string arguments are now ignored
logger.info("Server started on port", 3000)  // ✅ Not flagged
logger.error("Connection failed:", error)    // ✅ Not flagged
logger.debug({ request }, "received")        // ✅ Not flagged
```

Alternatively, you can use `UnlocalizedFunction<T>` directly:

```ts
import type { UnlocalizedFunction } from "eslint-plugin-lingui-typescript/types"

interface Logger {
  debug(...args: unknown[]): void
  info(...args: unknown[]): void
}

// Option A: Type the variable
const logger: UnlocalizedFunction<Logger> = createLogger()

// Option B: Type the factory return
function createLogger(): UnlocalizedFunction<Logger> { ... }
```

### Example: Custom Logger (String Parameters Only)

If your logger only accepts strings, you can use `UnlocalizedLog` for individual parameters:

```ts
import type { UnlocalizedLog } from "eslint-plugin-lingui-typescript/types"

interface Logger {
  debug(message: UnlocalizedLog): void
  info(message: UnlocalizedLog): void
  warn(message: UnlocalizedLog): void
  error(message: UnlocalizedLog): void
}

const logger: Logger = createLogger()
logger.info("Starting server on port 3000")  // ✅ Not flagged
logger.error("Database connection failed")   // ✅ Not flagged
```

### Example: Analytics/Tracking

```ts
import type { UnlocalizedEvent } from "eslint-plugin-lingui-typescript/types"

interface Analytics {
  track(event: UnlocalizedEvent, data?: object): void
  page(name: UnlocalizedEvent): void
}

analytics.track("User Signed Up")        // ✅ Not flagged
analytics.track("Purchase Completed")    // ✅ Not flagged
```

### Example: Storage Keys

```ts
import type { UnlocalizedKey } from "eslint-plugin-lingui-typescript/types"

interface Storage {
  get(key: UnlocalizedKey): string | null
  set(key: UnlocalizedKey, value: string): void
}

storage.get("User Preferences")     // ✅ Not flagged
storage.set("Auth Token", token)    // ✅ Not flagged
```

### Example: Theme Configuration

```ts
import type { UnlocalizedStyle } from "eslint-plugin-lingui-typescript/types"

interface ThemeConfig {
  primaryColor: UnlocalizedStyle
  fontFamily: UnlocalizedStyle
  spacing: UnlocalizedStyle
}

const theme: ThemeConfig = {
  primaryColor: "#3b82f6",        // ✅ Not flagged
  fontFamily: "Inter, sans-serif", // ✅ Not flagged
  spacing: "1rem",                // ✅ Not flagged
}
```

### Example: Component Props

```ts
import type { UnlocalizedClassName } from "eslint-plugin-lingui-typescript/types"

interface ButtonProps {
  className?: UnlocalizedClassName
  iconClassName?: UnlocalizedClassName
  children: React.ReactNode
}

<Button className="px-4 py-2 bg-blue-500">  // ✅ Not flagged
  <Trans>Click me</Trans>
</Button>
```

### How It Works

These types use TypeScript's branded type pattern with two different markers:

**Parameter-level branding** (`__linguiIgnore`):

```ts
type UnlocalizedLog = string & { readonly __linguiIgnore?: "UnlocalizedLog" }
```

The rule checks if the parameter's contextual type has this property.

**Function-level branding** (`__linguiIgnoreArgs`):

```ts
type UnlocalizedFunction<T> = T & { readonly __linguiIgnoreArgs?: true }
```

The rule checks if the object/function being called has this property. If so, all string arguments are ignored.

**The `unlocalized()` helper:**

```ts
function unlocalized<T>(value: T): UnlocalizedFunction<T> {
  return value as UnlocalizedFunction<T>
}
```

This is an identity function—it returns the input unchanged at runtime. But it changes the compile-time type to include the `__linguiIgnoreArgs` brand, enabling automatic type inference without manual annotations.

## When Not To Use It

This rule requires TypeScript with type-aware linting enabled. If your project doesn't use TypeScript or doesn't need localization, disable this rule.
