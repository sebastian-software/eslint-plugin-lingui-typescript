# no-complex-expressions-in-message

Disallow complex expressions in Lingui messages.

## Why?

Complex expressions in translation messages:
- Make it harder for translators to understand the context
- Can cause issues with message extraction
- May lead to runtime errors if the expression fails
- Make the code harder to maintain

Extract complex logic to variables before using them in messages.

## Rule Details

This rule reports complex expressions inside `t` tagged templates and `<Trans>` components.

### ❌ Invalid

```tsx
// Binary/arithmetic expressions
t`Price: ${price * 1.2}`
<Trans>Total: {count + 1}</Trans>

// Non-whitelisted function calls
t`Random: ${Math.random()}`
<Trans>Date: {formatDate(date)}</Trans>
t`Items: ${items.join(', ')}`

// Member expressions (by default)
t`Hello ${user.name}`

// Conditional expressions
t`Status: ${isActive ? 'Active' : 'Inactive'}`

// Logical expressions
t`Name: ${name || 'Unknown'}`
```

### ✅ Valid

```tsx
// Simple identifiers
t`Hello ${name}`
<Trans>You have {count} items</Trans>

// Whitelisted Lingui helpers
t`Price: ${i18n.number(price)}`
t`Date: ${i18n.date(date)}`
<Trans>Price: {i18n.number(price)}</Trans>

// Extract complex logic first
const displayPrice = price * 1.2
t`Price: ${displayPrice}`

const formattedDate = formatDate(date)
<Trans>Date: {formattedDate}</Trans>
```

## Options

### `allowedCallees`

Array of function names that are allowed. Format: dot-separated strings.

Default: `["i18n.number", "i18n.date"]`

```ts
{
  "lingui-ts/no-complex-expressions-in-message": ["error", {
    "allowedCallees": ["i18n.number", "i18n.date", "formatCurrency"]
  }]
}
```

### `allowMemberExpressions`

Whether to allow simple member expressions like `props.name`. Default: `false`

```ts
{
  "lingui-ts/no-complex-expressions-in-message": ["error", {
    "allowMemberExpressions": true
  }]
}
```

### `maxExpressionDepth`

Maximum depth for member expression chains when `allowMemberExpressions` is `true`. Default: `1`

- `1`: allows `user.name` but not `user.address.street`
- `2`: allows up to `user.address.street`
- `null`: no limit

```ts
{
  "lingui-ts/no-complex-expressions-in-message": ["error", {
    "allowMemberExpressions": true,
    "maxExpressionDepth": 2
  }]
}
```

## When Not To Use It

If your codebase has established patterns that rely on inline expressions and you handle translation complexity elsewhere, you can disable this rule.

