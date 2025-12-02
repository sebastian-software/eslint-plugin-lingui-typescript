# consistent-plural-format

Enforce consistent plural format style (`#` hash or `${var}` template).

## Why?

Lingui supports two formats for interpolating the count value in plural messages:

1. **Hash format**: `"# items"` — uses `#` as a placeholder
2. **Template format**: `` `${count} items` `` — uses template literals

Mixing both styles in a codebase leads to inconsistency and confusion. This rule enforces one style throughout your project.

## Rule Details

This rule checks `plural()` calls and `<Plural>` components and reports when the wrong format style is used.

### With `style: "hash"` (default)

#### ❌ Invalid

```tsx
// Template format when hash is required
plural(count, {
  one: `${count} item`,
  other: `${count} items`
})

<Plural
  value={count}
  one={`${count} item`}
  other={`${count} items`}
/>
```

#### ✅ Valid

```tsx
// Hash format
plural(count, {
  one: "# item",
  other: "# items"
})

<Plural
  value={count}
  one="# item"
  other="# items"
/>
```

### With `style: "template"`

#### ❌ Invalid

```tsx
// Hash format when template is required
plural(count, {
  one: "# item",
  other: "# items"
})
```

#### ✅ Valid

```tsx
// Template format
plural(count, {
  one: `${count} item`,
  other: `${count} items`
})
```

## Options

### `style`

Which format style to enforce. Default: `"hash"`

- `"hash"` — Require `#` placeholder (Lingui's standard format)
- `"template"` — Require `${var}` template literals

```ts
// Enforce hash format (default)
{
  "lingui-ts/consistent-plural-format": ["error", { "style": "hash" }]
}

// Enforce template format
{
  "lingui-ts/consistent-plural-format": ["error", { "style": "template" }]
}
```

## When Not To Use It

If your project intentionally mixes both formats or you don't use `plural()` / `<Plural>`, you can disable this rule.
