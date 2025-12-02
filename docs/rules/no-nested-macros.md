# no-nested-macros

Disallow nesting of Lingui macros inside other Lingui macros.

## Why?

Nested macros can lead to:
- Confusing message extraction results
- Incorrect translation context
- Unexpected runtime behavior

Each translation unit should be independent and self-contained.

## Rule Details

This rule reports when a Lingui macro (`t`, `Trans`, `msg`, `defineMessage`) is used inside another Lingui macro.

### ❌ Invalid

```tsx
// t inside t
t`foo ${t`bar`}`

// Trans inside Trans
<Trans><Trans>Inner</Trans></Trans>

// t inside Trans
<Trans>{t`Hello`}</Trans>

// msg inside t
t`foo ${msg({ message: 'bar' })}`
```

### ✅ Valid

```tsx
// Separate, non-nested usage
t`Hello`
t`World`

// Normal interpolation
t`Hello ${name}`
<Trans>Hello {name}</Trans>

// Static message helpers
msg({ message: 'Hello' })
defineMessage({ message: 'Hello' })
```

## Options

### `macros`

An array of macro names to check. Default: `["t", "Trans", "msg", "defineMessage"]`

```ts
{
  "lingui-ts/no-nested-macros": ["error", {
    "macros": ["t", "Trans", "msg", "defineMessage", "plural", "select"]
  }]
}
```

### `allowDifferentMacros`

When `true`, only reports nesting of the *same* macro type. Default: `false`

```ts
// With allowDifferentMacros: true
<Trans>{t`Hello`}</Trans>  // ✅ Allowed (different macros)
<Trans><Trans>x</Trans></Trans>  // ❌ Still error (same macro)
```

```ts
{
  "lingui-ts/no-nested-macros": ["error", {
    "allowDifferentMacros": true
  }]
}
```

## When Not To Use It

If you have intentional patterns that require macro nesting (uncommon), you can disable this rule for specific lines or files.

