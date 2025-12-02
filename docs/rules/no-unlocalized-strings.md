# no-unlocalized-strings

Detect user-visible strings not wrapped in Lingui translation macros.

## Why?

Unlocalized strings can lead to:
- Incomplete translations
- Poor user experience for non-English speakers
- Difficulty tracking what needs translation

This rule helps catch user-visible text that should be wrapped in `t`, `<Trans>`, or other Lingui macros.

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

// Object properties
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

// TypeScript union types (type-aware)
type Status = "idle" | "loading" | "error"
```

## TypeScript Type-Aware Detection

When TypeScript type information is available, this rule can detect technical strings based on their types:

```tsx
// These are NOT reported (recognized as technical strings)
type Status = "idle" | "loading" | "error"
const [status, setStatus] = useState<Status>("idle")

const action: Action = { type: "save" }  // discriminated union
const ACTION_SAVE = "save" as const
```

## Options

### `ignoreFunctions`

Array of function names whose string arguments should be ignored.

Default: `["console.log", "console.warn", "console.error", "console.info", "console.debug", "require", "import"]`

```ts
{
  "lingui-ts/no-unlocalized-strings": ["warn", {
    "ignoreFunctions": ["console.log", "logger.debug", "t"]
  }]
}
```

### `ignoreProperties`

Array of property/attribute names whose string values should be ignored.

Default: `["className", "styleName", "style", "type", "id", "key", "name", "testID", "data-testid", "href", "src", "role", "aria-label", "aria-describedby", "aria-labelledby"]`

```ts
{
  "lingui-ts/no-unlocalized-strings": ["warn", {
    "ignoreProperties": ["className", "type", "variant", "testId"]
  }]
}
```

### `ignoreNames`

Array of variable names to ignore.

Default: `["__DEV__", "NODE_ENV"]`

### `ignorePattern`

Regex pattern for strings to ignore.

Default: `null`

```ts
{
  "lingui-ts/no-unlocalized-strings": ["warn", {
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

**Not reported (likely technical):**
- Empty or whitespace only
- Single characters
- ALL_CAPS_WITH_UNDERSCORES
- URLs and paths (`/`, `https://`, `mailto:`)
- Identifiers without spaces (`myFunction`, `my-css-class`)

## When Not To Use It

If your project doesn't need localization or you handle string detection differently, you can disable this rule.

## Severity

This rule defaults to `"warn"` in the recommended config since it may have false positives. Adjust the severity based on your project's needs.

