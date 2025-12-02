# valid-t-call-location

Enforce that `t` macro calls are inside functions, not at module top-level.

## Why?

Using `t` at module top-level causes issues:

- **Evaluation order**: The message is evaluated when the module loads, before the i18n context may be ready
- **Static extraction**: Some extraction tools expect messages inside functions
- **Hot reloading**: Top-level values don't update when locale changes
- **Testing**: Harder to mock or test translations

## Rule Details

This rule reports `t` tagged template expressions that are not inside a function, arrow function, or method.

### ❌ Invalid

```tsx
// Top-level variable
const msg = t`Hello`

// Top-level export
export const greeting = t`Welcome`

// Class property
class MyClass {
  message = t`Hello`
}

// Top-level object
const config = {
  message: t`Hello`
}
```

### ✅ Valid

```tsx
// Inside function
function Component() {
  const msg = t`Hello`
  return msg
}

// Inside arrow function
const getGreeting = () => t`Welcome`

// Inside method
class MyClass {
  getMessage() {
    return t`Hello`
  }
}

// Inside React component
function App() {
  return <div>{t`Welcome`}</div>
}

// Inside callback
items.map(() => t`Item`)

// Inside hook
function useTranslation() {
  return { message: t`Hello` }
}
```

## Options

### `allowTopLevel`

When `true`, allows `t` at module top-level. Default: `false`

Use this if you have a build setup that handles top-level translations correctly.

```ts
{
  "lingui-ts/valid-t-call-location": ["error", {
    "allowTopLevel": true
  }]
}
```

## When Not To Use It

If your build setup correctly handles top-level `t` calls (e.g., with compile-time extraction), you can disable this rule or set `allowTopLevel: true`.

