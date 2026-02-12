# t-call-in-function

> **OXLint compatible** — This rule works with [OXLint](https://oxc.rs/) via `jsPlugins`.

Enforce that `t` macro calls are inside functions, not at module top-level.

## Why?

Using `t` at module top-level causes serious issues:

- **Async loading**: The message catalog must be loaded first (often async). Top-level code runs before this completes.
- **Locale changes**: Top-level values are evaluated once and never update when the user switches locale.
- **SSR hydration**: Server and client may have different locales, causing hydration mismatches.
- **Testing**: Harder to mock or test translations.

## Rule Details

This rule reports `t` tagged template expressions that are not inside a function, arrow function, method, or class property.

### ❌ Invalid

```tsx
// Top-level variable
const msg = t`Hello`

// Top-level export
export const greeting = t`Welcome`

// Top-level object
const config = {
  message: t`Hello`
}

// Top-level array
const messages = [t`One`, t`Two`]
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

// Inside class property (evaluated at instantiation time)
class MyComponent {
  label = t`Submit`
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

// Inside IIFE
const msg = (() => t`Hello`)()
```

## Class Properties

Class properties are allowed because they are evaluated at class instantiation time (when `new MyClass()` is called), not at module load time. This means:

1. The i18n library is already initialized
2. The current locale is available
3. Each instance can have different translations

```tsx
// ✅ Valid - evaluated when the class is instantiated
class Button {
  label = t`Click me`
}

// ❌ Invalid - evaluated at module load time
const label = t`Click me`
```

## Options

This rule has no options. Top-level `t` calls are always an error.

## When Not To Use It

If you have a very specific build setup that statically extracts and replaces `t` calls at compile time (like Babel macros with static extraction), you might not need this rule. However, this is rare and you should verify your setup handles locale changes correctly.
