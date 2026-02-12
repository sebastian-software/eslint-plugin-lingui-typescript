# text-restrictions

> **OXLint compatible** — This rule works with [OXLint](https://oxc.rs/) via `jsPlugins`.

Enforce project-specific restrictions on Lingui message text content.

## Why?

Consistent message formatting helps with:

- Translation quality (avoiding HTML entities, escaped characters)
- Preventing trivial messages (too short)
- Enforcing project-specific style guides
- Custom error messages for each restriction

## Rule Details

This rule allows you to configure forbidden patterns (with custom messages) and minimum length requirements for translation messages.

### ❌ Invalid (with configuration)

```tsx
// With rules containing pattern for newlines
t`Hello\nWorld`

// With rules containing pattern for HTML entities
t`Hello&nbsp;World`
<Trans>Line&nbsp;1</Trans>

// With minLength: 5
t`Hi`                  // Too short (2 chars)
<Trans>X</Trans>       // Too short (1 char)
```

### ✅ Valid

```tsx
// Normal messages
t`Hello World`
<Trans>Welcome to our app</Trans>

// Messages meeting minLength requirement
t`Hello`  // With minLength: 5

// Messages not matching forbidden patterns
t`Hello World`
```

## Options

### `rules`

Array of restriction rules. Each rule has:

- `patterns`: Array of regex patterns to match
- `message`: Custom error message when pattern matches
- `flags`: Optional regex flags (e.g., `"i"` for case-insensitive)

Default: `[]`

```ts
{
  "lingui-ts/text-restrictions": ["error", {
    "rules": [
      {
        "patterns": ["\\n", "\\r"],
        "message": "Newlines are not allowed in translation messages"
      },
      {
        "patterns": ["&nbsp;", "&[a-z]+;"],
        "message": "HTML entities should not be used. Use actual characters instead."
      },
      {
        "patterns": ["TODO", "FIXME"],
        "message": "TODO markers should be removed before committing",
        "flags": "i"
      },
      {
        "patterns": ["!{2,}", "\\?{2,}"],
        "message": "Avoid excessive punctuation in user-facing text"
      }
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

Note: Empty messages (`t```) don't trigger `minLength` — use other rules to handle empty messages if needed.

## Example Configuration

```ts
{
  "lingui-ts/text-restrictions": ["error", {
    "rules": [
      {
        "patterns": ["&nbsp;", "&amp;", "&lt;", "&gt;", "&quot;"],
        "message": "Use actual characters instead of HTML entities"
      },
      {
        "patterns": ["\\bOK\\b"],
        "message": "Use 'Okay' instead of 'OK' for consistency"
      },
      {
        "patterns": ["click here", "Click Here"],
        "message": "Avoid 'click here' - use descriptive link text",
        "flags": "i"
      }
    ],
    "minLength": 2
  }]
}
```

## When Not To Use It

This rule is opt-in and requires configuration to be useful. If you don't have specific text formatting requirements, you don't need to enable it.

## Not in Recommended Config

This rule is **not** included in the recommended config because it requires project-specific configuration.
