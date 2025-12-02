# no-single-variable-message

Disallow Lingui messages that consist only of a single variable.

## Why?

Messages containing only a variable provide no context for translators and cannot be properly translated. The translator has no way of knowing what the variable represents or how to adapt the translation for different languages.

## Rule Details

This rule reports Lingui messages (`t` tagged templates and `<Trans>` components) that contain only a single variable with no surrounding text.

### ❌ Invalid

```tsx
// Template literal with only a variable
t`${status}`
t`${user.name}`
t` ${status} `  // whitespace doesn't count as text

// JSX with only a variable
<Trans>{label}</Trans>
<Trans>{user.name}</Trans>
<Trans>  {status}  </Trans>
```

### ✅ Valid

```tsx
// Template literal with text
t`Status: ${status}`
t`Hello ${name}`
t`${count} items`

// Multiple variables are fine (implies structure)
t`${first} and ${second}`

// JSX with text
<Trans>Hello {name}</Trans>
<Trans>Status: {status}</Trans>
<Trans>{count} items remaining</Trans>

// Plain text is fine
t`Hello World`
<Trans>Hello World</Trans>
```

## Options

This rule has no options.

## When Not To Use It

If you have valid use cases for single-variable messages and handle the translation context elsewhere, you can disable this rule.

