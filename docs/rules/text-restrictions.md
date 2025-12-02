# text-restrictions

Enforce project-specific restrictions on Lingui message text content.

## Why?

Consistent message formatting helps with:
- Translation quality (avoiding HTML entities, escaped characters)
- Preventing trivial messages (single characters)
- Enforcing project-specific style guides

## Rule Details

This rule allows you to configure forbidden patterns and minimum length requirements for translation messages.

### ❌ Invalid (with configuration)

```tsx
// With forbiddenPatterns: ["\\n", "&nbsp;"]
t`Hello\nWorld`        // Contains newline
t`Hello&nbsp;World`    // Contains HTML entity
<Trans>Line&nbsp;1</Trans>

// With minLength: 5
t`Hi`                  // Too short (2 chars)
<Trans>X</Trans>       // Too short (1 char)

// With forbiddenPatterns: ["!{2,}"]
t`Hello World!!!`      // Matches regex (multiple exclamation marks)
```

### ✅ Valid

```tsx
// Normal messages
t`Hello World`
<Trans>Welcome to our app</Trans>

// Messages meeting minLength requirement
t`Hello`  // With minLength: 5

// Messages not matching forbidden patterns
t`Hello World`  // With forbiddenPatterns: ["\\n"]
```

## Options

### `forbiddenPatterns`

Array of regex patterns that should not appear in messages. Default: `[]`

```ts
{
  "lingui-ts/text-restrictions": ["error", {
    "forbiddenPatterns": [
      "\\n",           // No newlines
      "&nbsp;",        // No HTML entities
      "&[a-z]+;",      // No HTML entities (regex)
      "TODO",          // No TODO markers
      "!{2,}"          // No multiple exclamation marks
    ]
  }]
}
```

### `minLength`

Minimum character length for messages (after trimming whitespace). Default: `null` (no minimum)

```ts
{
  "lingui-ts/text-restrictions": ["error", {
    "minLength": 2
  }]
}
```

Note: Empty messages (`t```) don't trigger `minLength` — use other rules to handle empty messages.

## When Not To Use It

This rule is opt-in and requires configuration. If you don't have specific text formatting requirements, you don't need to enable it.

## Not in Recommended Config

This rule is **not** included in the recommended config because it requires project-specific configuration to be useful.

