# prefer-trans-in-jsx

Prefer `<Trans>` over `` {t`...`} `` in JSX.

## Why?

In JSX, developers often write `` {t`Save changes`} `` instead of `<Trans>Save changes</Trans>`. The `<Trans>` component is preferred because:

- It produces better extraction results for translators (preserving JSX structure)
- It's the idiomatic Lingui pattern for JSX contexts
- It avoids unnecessary string interpolation overhead

## Rule Details

This rule detects `t` tagged template literals used inside JSX and suggests using `<Trans>` instead.

### ❌ Invalid

```tsx
// Direct use in JSX — auto-fixable
<button>{t`Save changes`}</button>
<p>{t`Hello ${name}, welcome!`}</p>

// Nested in expressions — auto-fixable (each t`` replaced individually)
<span>{isActive ? t`Active` : t`Inactive`}</span>
<p>{show && t`Hello World`}</p>
```

### ✅ Valid

```tsx
// Trans component in JSX
<Trans>Save changes</Trans>
<Trans>Hello {name}, welcome!</Trans>

// t used outside JSX
const msg = t`Save changes`
```

## Auto-Fix

When `` {t`...`} `` is the direct expression inside a JSX expression container, the rule provides an auto-fix that:

1. Replaces `` {t`...`} `` with `<Trans>...</Trans>`
2. Converts template expressions (`${expr}`) to JSX expressions (`{expr}`)
3. Adds `import { Trans } from "@lingui/react/macro"` if not already imported

When `t` appears inside a more complex expression (ternary, logical AND, etc.), each `` t`...` `` is individually replaced with `<Trans>...</Trans>`, preserving the surrounding expression structure:

```tsx
// Before
<span>{isActive ? t`Active` : t`Inactive`}</span>

// After fix
<span>{isActive ? <Trans>Active</Trans> : <Trans>Inactive</Trans>}</span>
```

## Options

This rule has no options.

## When Not To Use It

If you prefer using the `t` macro in JSX or have specific reasons to avoid the `<Trans>` component, you can disable this rule.
