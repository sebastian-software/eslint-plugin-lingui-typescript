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

This rule reports string literals and JSX text that appear to be user-visible UI text but are not wrapped in Lingui translation macros.

### ❌ Invalid

```tsx
// Plain strings that look like UI text
const label = "Save changes"
const msg = "Something went wrong!"

// JSX text
<button>Save changes</button>
<p>Please try again.</p>

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
```

This covers common patterns in component libraries like Chakra UI, Material UI, and custom component props.

#### Auto-Detected Styling Constants

UPPER_CASE constant names with styling-related suffixes are also automatically ignored:

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

## When Not To Use It

This rule requires TypeScript with type-aware linting enabled. If your project doesn't use TypeScript or doesn't need localization, disable this rule.
