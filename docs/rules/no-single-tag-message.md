# no-single-tag-message

Disallow Lingui messages that consist only of a single JSX element without surrounding text.

## Why?

Messages containing only a single element without surrounding text provide limited context for translators. The element itself (like a link or button) should be part of a larger sentence to give translators the full context of how it's used.

## Rule Details

This rule reports `<Trans>` components that contain only a single JSX element with no accompanying text.

### ❌ Invalid

```tsx
// Single link without context
<Trans><a href="/terms">Terms</a></Trans>

// Single button
<Trans><button>Click me</button></Trans>

// Single styled element
<Trans><strong>Important</strong></Trans>

// Whitespace doesn't count as text
<Trans>  <span>Text</span>  </Trans>
```

### ✅ Valid

```tsx
// Text before element
<Trans>Read <a href="/terms">terms</a></Trans>

// Text after element
<Trans><a href="/terms">Terms</a> and conditions</Trans>

// Text with styled portion
<Trans><strong>Important:</strong> Please read carefully</Trans>

// Multiple elements (implies structure)
<Trans><strong>Bold</strong> and <em>italic</em></Trans>

// Mixed content with expression
<Trans><strong>Hello</strong> {name}</Trans>

// Only text is fine
<Trans>Hello World</Trans>
```

## Options

This rule has no options.

## When Not To Use It

If you intentionally use `<Trans>` to wrap single elements for extraction purposes and handle context elsewhere, you can disable this rule.

