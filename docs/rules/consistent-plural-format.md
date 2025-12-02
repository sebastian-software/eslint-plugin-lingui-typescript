# consistent-plural-format

Ensure `<Plural>` component has required plural category props.

## Why?

Proper pluralization requires specific props for different quantities. Missing props can cause:
- Runtime errors or fallback to incorrect text
- Incomplete translations
- Poor user experience for different languages

## Rule Details

This rule ensures that `<Plural>` components include all required plural category props.

### ❌ Invalid

```tsx
// Missing 'other' (required by default)
<Plural value={count} one="# item" />

// Missing 'one' (required by default)
<Plural value={count} other="# items" />

// Missing both required props
<Plural value={count} zero="None" />
```

### ✅ Valid

```tsx
// All required props present
<Plural value={count} one="# item" other="# items" />

// Additional props are allowed
<Plural value={count} one="One" other="Many" zero="None" />

// With expressions
<Plural value={count} one={oneMsg} other={otherMsg} />
```

## Options

### `requiredKeys`

Array of plural category props that must be present. Default: `["one", "other"]`

Common CLDR plural categories: `zero`, `one`, `two`, `few`, `many`, `other`

```ts
// Require only 'other'
{
  "lingui-ts/consistent-plural-format": ["error", {
    "requiredKeys": ["other"]
  }]
}

// Require zero, one, and other
{
  "lingui-ts/consistent-plural-format": ["error", {
    "requiredKeys": ["zero", "one", "other"]
  }]
}
```

## When Not To Use It

If your project uses ICU message format directly in `t` strings instead of `<Plural>` components, this rule won't help. It only checks JSX `<Plural>` components.
