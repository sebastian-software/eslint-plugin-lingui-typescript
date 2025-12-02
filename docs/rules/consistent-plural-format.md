# consistent-plural-format

Ensure consistent plural usage with required keys.

## Why?

Proper pluralization requires specific keys for different quantities. Missing keys can cause:
- Runtime errors or fallback to incorrect text
- Incomplete translations
- Poor user experience for different languages

## Rule Details

This rule ensures that `plural()` calls include all required plural keys.

### ❌ Invalid

```tsx
// Missing 'other' (required by default)
plural(count, { one: '# item' })

// Missing 'one' (required by default)
plural(count, { other: '# items' })

// Missing both required keys
plural(count, { zero: 'None' })

// With i18n prefix
i18n.plural(count, { one: '# item' })  // Missing 'other'
```

### ✅ Valid

```tsx
// All required keys present
plural(count, { one: '# item', other: '# items' })

// Additional keys are allowed
plural(count, { one: 'One', other: 'Many', zero: 'None' })

// With i18n prefix
i18n.plural(count, { one: '# item', other: '# items' })
```

## Options

### `requiredKeys`

Array of plural keys that must be present. Default: `["one", "other"]`

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

If your project uses a different pluralization approach or handles missing keys gracefully at runtime, you can disable this rule.

