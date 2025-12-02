# valid-t-call-location

Enforce that `t` macro calls are inside functions, not at module top-level.

## Why?

Using `t` at module top-level causes serious issues:

- **Async loading**: The message catalog must be loaded first (often async). Top-level code runs before this completes.
- **Locale changes**: Top-level values are evaluated once and never update when the user switches locale.
- **SSR hydration**: Server and client may have different locales, causing hydration mismatches.
- **Testing**: Harder to mock or test translations.

## Rule Details

This rule reports `t` tagged template expressions that are not inside a function, arrow function, or method.

### Invalid

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

### Valid

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

This rule has no options. Top-level `t` calls are always an error.

## When Not To Use It

If you have a very specific build setup that statically extracts and replaces `t` calls at compile time, you might not need this rule. However, this is rare and you should verify your setup handles locale changes correctly.
