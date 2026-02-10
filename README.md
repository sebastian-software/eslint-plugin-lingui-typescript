# eslint-plugin-lingui-typescript

[![npm version](https://img.shields.io/npm/v/eslint-plugin-lingui-typescript.svg)](https://www.npmjs.com/package/eslint-plugin-lingui-typescript)
[![npm downloads](https://img.shields.io/npm/dm/eslint-plugin-lingui-typescript.svg)](https://www.npmjs.com/package/eslint-plugin-lingui-typescript)
[![CI](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/actions/workflows/ci.yml/badge.svg)](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

ESLint rules for [Lingui](https://lingui.dev/) that use TypeScript's type system to tell technical strings from user-facing text. No whitelists to maintain. No false positives to suppress. No configuration to tweak.

**[Documentation & Examples](https://sebastian-software.github.io/eslint-plugin-lingui-typescript/)**

## The problem with pattern-based i18n linting

i18n linters that rely on pattern matching can't tell a CSS class name from a button label, or a DOM event name from an error message. You end up maintaining long ignore lists and still get false positives every time someone calls a new API:

```ts
// Pattern-based linters flag all of these as "missing translation"
document.createElement("div")                    // It's a DOM tag name
element.addEventListener("click", handler)       // It's an event name
fetch(url, { mode: "cors" })                     // It's a typed option
const status: "idle" | "loading" = "idle"        // It's a string literal union
<Box className="flex items-center" />            // It's a CSS class
```

You add each one to a whitelist. The whitelist grows. New team members hit the same false positives all over again.

## How this plugin solves it

This plugin reads TypeScript's type information instead of guessing. When a string flows into a parameter typed as `keyof HTMLElementTagNameMap`, or is assigned to a variable typed as `"idle" | "loading" | "error"`, the plugin knows it's technical. You don't configure anything.

```ts
// Automatically ignored — TypeScript provides the context
document.createElement("div")                           // keyof HTMLElementTagNameMap
element.addEventListener("click", handler)              // keyof GlobalEventHandlersEventMap
fetch(url, { mode: "cors" })                            // RequestMode
date.toLocaleDateString("de-DE", { weekday: "long" })  // Intl.DateTimeFormatOptions

type Status = "idle" | "loading" | "error"
const status: Status = "loading"                        // String literal union

// Styling props and utility patterns — recognized automatically
<Box containerClassName="flex items-center" />          // *ClassName, *Color, *Style
<div className={clsx("px-4", "py-2")} />                // className utilities (clsx, cn)
<Calendar classNames={{ day: "bg-white" }} />           // Nested classNames objects
const colorClasses = { active: "bg-green-100" }         // *Classes, *Colors, *Styles
const price = "1,00€"                                   // No letters = not user-facing
if (status === "active") {}                              // Binary comparison

// Reported — these actually need translation
const message = "Welcome to our app"
<button>Save changes</button>
```

The plugin also verifies that `t`, `Trans`, and other macros actually come from `@lingui/*` packages through TypeScript's symbol resolution, not just name matching:

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

### Installation

```bash
npm install --save-dev eslint-plugin-lingui-typescript
```

### Configuration

Add the recommended config to your `eslint.config.ts`:

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

That's it. The plugin starts working immediately — DOM APIs, Intl methods, string literal unions, styling props, comparisons, and numeric strings are all handled out of the box.

## Rules

| Rule | Description | Recommended |
|------|-------------|:-----------:|
| [no-unlocalized-strings](docs/rules/no-unlocalized-strings.md) | Detects user-visible strings not wrapped in Lingui macros. Uses TypeScript types to automatically ignore technical strings. | ✅ |
| [no-single-variables-to-translate](docs/rules/no-single-variables-to-translate.md) | Disallows messages that consist only of variables without surrounding text — translators need context. | ✅ |
| [no-single-tag-to-translate](docs/rules/no-single-tag-to-translate.md) | Disallows `<Trans>` components that contain only a single JSX element without text. | ✅ |
| [no-nested-macros](docs/rules/no-nested-macros.md) | Prevents nesting Lingui macros inside each other. Nested macros create invalid message catalogs. | ✅ |
| [no-expression-in-message](docs/rules/no-expression-in-message.md) | Restricts embedded expressions to simple identifiers. Complex expressions must be extracted to named variables. | ✅ |
| [t-call-in-function](docs/rules/t-call-in-function.md) | Ensures `t` macro calls live inside functions, not at module scope where i18n isn't initialized yet. | ✅ |
| [consistent-plural-format](docs/rules/consistent-plural-format.md) | Enforces consistent plural value format — either `#` hash syntax or `${var}` template literals. | ✅ |
| [text-restrictions](docs/rules/text-restrictions.md) | Enforces project-specific text restrictions with custom patterns and messages. Requires configuration. | — |

## Branded types for edge cases

For strings that automatic detection can't cover (custom loggers, analytics events, internal keys), the plugin exports branded types:

```ts
import { unlocalized } from "eslint-plugin-lingui-typescript/types"

const logger = unlocalized({
  debug: (...args: unknown[]) => console.debug(...args),
  info: (...args: unknown[]) => console.info(...args),
  error: (...args: unknown[]) => console.error(...args),
})

logger.info("Server started on port", 3000)  // Automatically ignored
logger.error("Connection failed:", error)    // Automatically ignored
```

| Type | Use Case |
|------|----------|
| `UnlocalizedFunction<T>` | Wrap functions/objects to ignore all string arguments |
| `unlocalized(value)` | Helper function for automatic type inference |
| `UnlocalizedText` | Generic technical strings |
| `UnlocalizedLog` | Logger message parameters |
| `UnlocalizedStyle` | Style values (colors, fonts, spacing) |
| `UnlocalizedClassName` | CSS class names |
| `UnlocalizedEvent` | Analytics/tracking event names |
| `UnlocalizedKey` | Storage keys, query keys |

See the [no-unlocalized-strings documentation](docs/rules/no-unlocalized-strings.md#branded-types) for detailed examples.

## Migrating from eslint-plugin-lingui

This plugin is a drop-in alternative to the official [eslint-plugin-lingui](https://github.com/lingui/eslint-plugin-lingui). Rule names are compatible, making migration straightforward.

### What changes

| | eslint-plugin-lingui | This plugin |
|---------|---------------------|--------------------------------|
| **Detection method** | Heuristics + manual whitelists | TypeScript type system |
| **String literal unions** | Manual whitelist | Auto-detected |
| **DOM API strings** | Manual whitelist | Auto-detected |
| **Intl method arguments** | Manual whitelist | Auto-detected |
| **Styling props** | Manual whitelist | Auto-detected |
| **Styling constants** | Manual whitelist | Auto-detected |
| **Numeric strings** | Manual whitelist | Auto-detected |
| **Custom ignore patterns** | `ignoreFunctions` only | Branded types (`unlocalized()`) |
| **Macro verification** | Name-based | Package-origin verification |
| **ESLint** | v8 legacy config | v9 flat config |

### Why switch?

**Less configuration.** TypeScript's type system handles what used to require dozens of whitelist entries.

**Fewer false positives.** Strings typed as literal unions are recognized as non-translatable without any setup.

**Modern ESLint.** Built for ESLint 9 flat config from the ground up.

### Rule mapping

| eslint-plugin-lingui | eslint-plugin-lingui-typescript | Options |
|---------------------|--------------------------------|---------|
| `lingui/no-unlocalized-strings` | `lingui-ts/no-unlocalized-strings` | ⚠️ Different (see below) |
| `lingui/t-call-in-function` | `lingui-ts/t-call-in-function` | ✅ Compatible |
| `lingui/no-single-variables-to-translate` | `lingui-ts/no-single-variables-to-translate` | ✅ Compatible |
| `lingui/no-expression-in-message` | `lingui-ts/no-expression-in-message` | ✅ Compatible |
| `lingui/no-single-tag-to-translate` | `lingui-ts/no-single-tag-to-translate` | ✅ Compatible |
| `lingui/text-restrictions` | `lingui-ts/text-restrictions` | ✅ Compatible (`rules`), + `minLength` |
| `lingui/consistent-plural-format` | `lingui-ts/consistent-plural-format` | ✅ Compatible (`style`) |
| `lingui/no-trans-inside-trans` | `lingui-ts/no-nested-macros` | ✅ Extended (all macros) |

### Options Changes for `no-unlocalized-strings`

TypeScript types replace most manual configuration:

| Original Option | This Plugin | Notes |
|-----------------|-------------|-------|
| `useTsTypes` | — | Always enabled |
| `ignore` (array of regex) | `ignorePattern` (single regex) | Simplified |
| `ignoreFunctions` | `ignoreFunctions` | Simplified (Console/Error auto-detected) |
| `ignoreNames` (with regex support) | `ignoreNames` | Plain strings only |
| — | `ignoreProperties` | New: separate option for JSX attributes and object properties |
| `ignoreMethodsOnTypes` | — | Not needed (handled by TypeScript) |

**What you can drop from your config:**
- `useTsTypes: true` — always enabled
- Most `ignoreFunctions` entries for DOM APIs — auto-detected via types
- Most `ignoreNames` entries for typed parameters — auto-detected via types
- Most `ignoreProperties` entries (like `type`, `role`, `href`) — auto-detected via types
- `ignoreMethodsOnTypes` — handled automatically

### Migration steps

1. Remove the old plugin:
   ```bash
   npm uninstall eslint-plugin-lingui
   ```

2. Install this plugin:
   ```bash
   npm install --save-dev eslint-plugin-lingui-typescript
   ```

3. Update your ESLint config to flat config format (if not already):
   ```ts
   // eslint.config.ts
   import linguiPlugin from "eslint-plugin-lingui-typescript"

   export default [
     // ... other configs
     linguiPlugin.configs["flat/recommended"]
   ]
   ```

4. Update rule names in your config (change prefix from `lingui/` to `lingui-ts/`).

5. Review your ignore lists — many entries are no longer needed.

## Contributing

Contributions are welcome. Please read our [Contributing Guide](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md) before submitting a PR.

## Related projects

- [Lingui](https://lingui.dev/) — The i18n library this plugin is built for
- [eslint-plugin-lingui](https://github.com/lingui/eslint-plugin-lingui) — The official Lingui ESLint plugin for JavaScript projects
- [typescript-eslint](https://typescript-eslint.io/) — The foundation that makes type-aware linting possible

## License

[MIT](LICENSE)

---

Made with care by [Sebastian Software](https://www.sebastian-software.de)
