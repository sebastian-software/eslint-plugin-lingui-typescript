# no-complex-expressions-in-message

Disallow complex expressions in Lingui messages — only simple identifiers are allowed.

## Why?

Complex expressions in translation messages cause problems:

- **Translators can't understand code**: Expressions like `${user.name}` or `${formatPrice(price)}` are meaningless to translators
- **Missing context**: Translators need descriptive placeholder names, not code
- **Extraction issues**: Complex expressions can cause problems with message extraction tools
- **Maintenance burden**: Inline logic is harder to test and maintain

The solution is simple: extract any complex expression to a named variable first.

## Rule Details

This rule reports any expression inside `t` tagged templates or `<Trans>` components that is not a simple identifier.

**Only simple identifiers are allowed**: `${name}`, `${count}`, `${formattedPrice}`

### ❌ Invalid

```tsx
// Member expressions
t`Hello ${user.name}`
<Trans>Hello {user.name}</Trans>

// Function calls
t`Price: ${formatPrice(price)}`
t`Random: ${Math.random()}`
<Trans>Date: {formatDate(date)}</Trans>

// Binary expressions
t`Total: ${price * 1.2}`
<Trans>Sum: {a + b}</Trans>

// Conditional expressions
t`Status: ${isActive ? "Active" : "Inactive"}`

// Logical expressions
t`Name: ${name || "Unknown"}`

// Template literals inside expressions
t`Result: ${`nested ${value}`}`

// Legacy placeholder syntax
t`Hello ${{ name: userName }}`
```

### ✅ Valid

```tsx
// Simple identifiers only
t`Hello ${name}`
t`You have ${count} items`
<Trans>Hello {name}</Trans>
<Trans>Total: {formattedTotal}</Trans>

// Extract complex expressions first
const displayName = user.name
t`Hello ${displayName}`

const formattedPrice = formatPrice(price)
<Trans>Price: {formattedPrice}</Trans>

const statusText = isActive ? "Active" : "Inactive"
t`Status: ${statusText}`

// Whitespace expressions are allowed in JSX
<Trans>Hello{" "}{name}</Trans>
```

## Recommended Pattern

Always extract expressions to descriptively-named variables:

```tsx
// ❌ Bad: translator sees "${user.profile.displayName}"
t`Welcome back, ${user.profile.displayName}!`

// ✅ Good: translator sees "${userName}"
const userName = user.profile.displayName
t`Welcome back, ${userName}!`

// ❌ Bad: translator sees "${items.filter(...).length}"
t`${items.filter(i => i.active).length} active items`

// ✅ Good: translator sees "${activeCount}"
const activeCount = items.filter(i => i.active).length
t`${activeCount} active items`
```

## Options

This rule has no options. All non-identifier expressions are disallowed.

## Note on Lingui Helpers

Unlike some other i18n libraries, Lingui's `plural()`, `select()`, and `selectOrdinal()` should **not** be nested inside `t` templates. Use the JSX components `<Plural>`, `<Select>`, `<SelectOrdinal>` instead, or ICU message syntax in your translation catalog.

## When Not To Use It

If your codebase has established patterns that rely heavily on inline expressions and you handle translation complexity elsewhere, you can disable this rule. However, consider the impact on translator experience.
