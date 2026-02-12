# eslint-plugin-lingui-typescript

[![npm version](https://img.shields.io/npm/v/eslint-plugin-lingui-typescript.svg)](https://www.npmjs.com/package/eslint-plugin-lingui-typescript)
[![npm downloads](https://img.shields.io/npm/dm/eslint-plugin-lingui-typescript.svg)](https://www.npmjs.com/package/eslint-plugin-lingui-typescript)
[![CI](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/actions/workflows/ci.yml/badge.svg)](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/actions/workflows/ci.yml)
[![OXLint compatible](https://img.shields.io/badge/OXLint-compatible-4eff7e?logo=oxc)](https://oxc.rs/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

ESLint rules for [Lingui](https://lingui.dev/) that read TypeScript types instead of guessing. Your whitelist goes away.

**[Documentation](https://sebastian-software.github.io/eslint-plugin-lingui-typescript/)**

## The whitelist treadmill

Every i18n linter that relies on pattern matching hits the same wall. It can't tell a CSS class from a button label, or a DOM event name from an error message. So you add them to the whitelist. Then someone calls `document.createElement("div")` and that gets flagged too. More entries. A new team member joins, hits the same false positives, adds the same entries.

```ts
// Pattern-based linters flag all of these as "missing translation"
document.createElement("div")                    // It's a DOM tag name
element.addEventListener("click", handler)       // It's an event name
fetch(url, { mode: "cors" })                     // It's a typed option
const status: "idle" | "loading" = "idle"        // It's a string literal union
<Box className="flex items-center" />            // It's a CSS class
```

The list grows. The problem stays.

## When your linter reads types

A string flowing into `keyof HTMLElementTagNameMap` isn't user text. A variable typed as `"idle" | "loading" | "error"` doesn't need translation. TypeScript has had this information all along — this plugin reads it directly.

```ts
// TypeScript already has the context — this plugin uses it
document.createElement("div")                           // keyof HTMLElementTagNameMap
element.addEventListener("click", handler)              // keyof GlobalEventHandlersEventMap
fetch(url, { mode: "cors" })                            // RequestMode
date.toLocaleDateString("de-DE", { weekday: "long" })  // Intl.DateTimeFormatOptions

type Status = "idle" | "loading" | "error"
const status: Status = "loading"                        // String literal union

// Styling props and utility patterns — recognized out of the box
<Box containerClassName="flex items-center" />          // *ClassName, *Color, *Style
<div className={clsx("px-4", "py-2")} />               // className utilities (clsx, cn)
<Calendar classNames={{ day: "bg-white" }} />           // Nested classNames objects
const colorClasses = { active: "bg-green-100" }         // *Classes, *Colors, *Styles
const price = "1,00€"                                   // No letters = not user-facing
if (status === "active") {}                             // Binary comparison

// These actually need translation — and get reported
const message = "Welcome to our app"
<button>Save changes</button>
```

Macro verification works the same way. The plugin checks that `t`, `Trans`, and friends actually come from `@lingui/*` packages through TypeScript's symbol resolution:

```ts
import { t } from "@lingui/macro"
const label = t`Save`              // Recognized as Lingui

const t = (key: string) => map[key]
const label = t("save")            // Not confused with Lingui
```

## Getting started

### Requirements

- Node.js >= 24, ESLint >= 9, TypeScript >= 5
- `typescript-eslint` with type-aware linting enabled

### Install

```bash
npm install --save-dev eslint-plugin-lingui-typescript
```

### Configure

Add the recommended config to `eslint.config.ts`:

```ts
import eslint from "@eslint/js"
import tseslint from "typescript-eslint"
import linguiPlugin from "eslint-plugin-lingui-typescript"

export default [
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  linguiPlugin.configs["flat/recommended"],
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      }
    }
  }
]
```

Or pick individual rules:

```ts
{
  plugins: {
    "lingui-ts": linguiPlugin
  },
  rules: {
    "lingui-ts/no-unlocalized-strings": "error",
    "lingui-ts/no-single-variables-to-translate": "error"
  }
}
```

That's it. DOM APIs, Intl methods, string literal unions, styling props, comparisons, numeric strings — all handled from the first run.

## OXLint support

This plugin works with [OXLint](https://oxc.rs/) via its [JavaScript plugin system](https://oxc.rs/docs/guide/usage/linter/js-plugins.html). Eight of nine rules run natively in OXLint — no code changes, no wrapper, no adapter.

Add to your `.oxlintrc.json`:

```json
{
  "jsPlugins": ["eslint-plugin-lingui-typescript"],
  "rules": {
    "lingui-typescript/no-nested-macros": "error",
    "lingui-typescript/no-single-variables-to-translate": "error",
    "lingui-typescript/no-single-tag-to-translate": "error",
    "lingui-typescript/t-call-in-function": "warn",
    "lingui-typescript/no-expression-in-message": "warn",
    "lingui-typescript/consistent-plural-format": "warn",
    "lingui-typescript/prefer-trans-in-jsx": "warn",
    "lingui-typescript/text-restrictions": ["error", { "rules": [] }]
  }
}
```

The only rule not supported in OXLint is `no-unlocalized-strings` — it uses TypeScript's type checker at runtime to distinguish UI text from technical strings. As OXLint's [type-aware linting](https://oxc.rs/blog/2025-12-08-type-aware-alpha) matures, this rule will follow.

**Dual setup** — run OXLint for speed, ESLint for full coverage:

```bash
oxlint . && eslint .
```

## Rules

| Rule | Description | Recommended | Fixable | OXLint |
|------|-------------|:-----------:|:-------:|:------:|
| [no-unlocalized-strings](docs/rules/no-unlocalized-strings.md) | Catches user-visible strings not wrapped in Lingui macros. Uses TypeScript types to skip technical strings automatically. | error | ✅ | *1 |
| [no-single-variables-to-translate](docs/rules/no-single-variables-to-translate.md) | Prevents messages with only variables and no text — translators need context. | error | — | ✅ |
| [no-single-tag-to-translate](docs/rules/no-single-tag-to-translate.md) | Prevents `<Trans>` wrapping a single JSX element without surrounding text. | error | — | ✅ |
| [no-nested-macros](docs/rules/no-nested-macros.md) | Prevents nesting Lingui macros inside each other — nested macros produce broken catalogs. | error | — | ✅ |
| [no-expression-in-message](docs/rules/no-expression-in-message.md) | Keeps expressions simple inside messages. Complex logic goes into named variables. | warn | — | ✅ |
| [t-call-in-function](docs/rules/t-call-in-function.md) | Keeps `t` macro calls inside functions where i18n is initialized. | warn | — | ✅ |
| [consistent-plural-format](docs/rules/consistent-plural-format.md) | Enforces consistent plural format — either `#` hash or `${var}` template literals. | warn | ✅ | ✅ |
| [prefer-trans-in-jsx](docs/rules/prefer-trans-in-jsx.md) | Prefers `<Trans>` over `` {t`...`} `` in JSX for consistency. | warn | ✅ | ✅ |
| [text-restrictions](docs/rules/text-restrictions.md) | Enforces project-specific text patterns and restrictions. Requires configuration. | — | — | ✅ |

*1 Requires TypeScript's type checker to distinguish UI text from technical strings. OXLint's [type-aware linting](https://oxc.rs/blog/2025-12-08-type-aware-alpha) is in alpha — once stable, this rule will be supported too.

## Branded types for edge cases

Automatic detection covers most strings, but some cases need a hint — custom loggers, analytics events, internal keys. The plugin exports branded types for exactly this:

```ts
import { unlocalized } from "eslint-plugin-lingui-typescript/types"

const logger = unlocalized({
  debug: (...args: unknown[]) => console.debug(...args),
  info: (...args: unknown[]) => console.info(...args),
  error: (...args: unknown[]) => console.error(...args),
})

logger.info("Server started on port", 3000)  // Not flagged
logger.error("Connection failed:", error)    // Not flagged
```

| Type | Use case |
|------|----------|
| `UnlocalizedFunction<T>` | Wrap functions/objects to ignore all string arguments |
| `unlocalized(value)` | Helper for automatic type inference |
| `UnlocalizedText` | Generic technical strings |
| `UnlocalizedLog` | Logger message parameters |
| `UnlocalizedStyle` | Style values (colors, fonts, spacing) |
| `UnlocalizedClassName` | CSS class names |
| `UnlocalizedEvent` | Analytics/tracking event names |
| `UnlocalizedKey` | Storage keys, query keys |
| `UnlocalizedRecord<K>` | Key-value maps (`Record<K, UnlocalizedText>`) |

As the plugin gets smarter, some brands become unnecessary. Enable `reportUnnecessaryBrands` to find the ones you can remove:

```ts
"lingui-ts/no-unlocalized-strings": ["error", { "reportUnnecessaryBrands": true }]
```

Full details in the [no-unlocalized-strings docs](docs/rules/no-unlocalized-strings.md#branded-types).

## Coming from eslint-plugin-lingui?

Drop-in alternative to [eslint-plugin-lingui](https://github.com/lingui/eslint-plugin-lingui). Rule names are compatible.

### What's different

| | eslint-plugin-lingui | This plugin |
|---------|---------------------|--------------------------------|
| **How it works** | Heuristics + manual whitelists | TypeScript type system |
| **String literal unions** | Manual whitelist | Auto-detected |
| **DOM API strings** | Manual whitelist | Auto-detected |
| **Intl method arguments** | Manual whitelist | Auto-detected |
| **Styling props** | Manual whitelist | Auto-detected |
| **Styling constants** | Manual whitelist | Auto-detected |
| **Numeric strings** | Manual whitelist | Auto-detected |
| **Custom ignores** | `ignoreFunctions` only | Branded types (`unlocalized()`) |
| **Macro verification** | Name-based | Package-origin verification |
| **ESLint** | v8 legacy config | v9 flat config |

### Migration

1. `npm uninstall eslint-plugin-lingui`
2. `npm install --save-dev eslint-plugin-lingui-typescript`
3. Switch to flat config:
   ```ts
   import linguiPlugin from "eslint-plugin-lingui-typescript"
   export default [
     // ...
     linguiPlugin.configs["flat/recommended"]
   ]
   ```
4. Change rule prefix from `lingui/` to `lingui-ts/`
5. Review your ignore lists — most entries are no longer needed

### Options mapping for no-unlocalized-strings

| Original | This plugin | Notes |
|----------|-------------|-------|
| `useTsTypes` | — | Always on |
| `ignore` (regex array) | `ignorePattern` (single regex) | Simplified |
| `ignoreFunctions` | `ignoreFunctions` | Console/Error auto-detected |
| `ignoreNames` (regex) | `ignoreNames` | Plain strings only |
| — | `ignoreProperties` | New: JSX attributes and object properties |
| `ignoreMethodsOnTypes` | — | Handled by TypeScript |

## Contributing

Contributions welcome. See the [Contributing Guide](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md).

## Related

- [Lingui](https://lingui.dev/) — The i18n library this plugin is built for
- [eslint-plugin-lingui](https://github.com/lingui/eslint-plugin-lingui) — The official Lingui ESLint plugin
- [typescript-eslint](https://typescript-eslint.io/) — Makes type-aware linting possible
- [OXLint](https://oxc.rs/) — High-performance linter with JS plugin support

## License

[MIT](LICENSE)

---

Built by [Sebastian Software](https://www.sebastian-software.de)
