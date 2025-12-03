# eslint-plugin-lingui-typescript

[![npm version](https://img.shields.io/npm/v/eslint-plugin-lingui-typescript.svg)](https://www.npmjs.com/package/eslint-plugin-lingui-typescript)
[![npm downloads](https://img.shields.io/npm/dm/eslint-plugin-lingui-typescript.svg)](https://www.npmjs.com/package/eslint-plugin-lingui-typescript)
[![CI](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/actions/workflows/ci.yml/badge.svg)](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> 🔍 Type-aware ESLint rules for [Lingui](https://lingui.dev/) — catch unlocalized strings with zero configuration using TypeScript's type system.

## Why TypeScript?

Traditional i18n linters rely on heuristics and manual whitelists to distinguish user-visible text from technical strings. This leads to false positives and constant configuration tweaking.

This plugin leverages TypeScript's type system to **automatically** recognize technical strings:

```ts
// ✅ Automatically ignored - TypeScript knows these are technical
document.createElement("div")                    // keyof HTMLElementTagNameMap
element.addEventListener("click", handler)       // keyof GlobalEventHandlersEventMap
fetch(url, { mode: "cors" })                     // RequestMode
date.toLocaleDateString("de-DE", { weekday: "long" })  // Intl.DateTimeFormatOptions

type Status = "idle" | "loading" | "error"
const status: Status = "loading"                 // String literal union

// ✅ Automatically ignored - styling props, constants, and numeric strings
<Box containerClassName="flex items-center" />   // *ClassName, *Color, *Style, etc.
<div className={clsx("px-4", "py-2")} />         // className utilities (clsx, cn, etc.)
<Calendar classNames={{ day: "bg-white" }} />    // nested classNames objects
const colorClasses = { active: "bg-green-100" }  // *Classes, *Colors, *Styles, etc.
const price = "1,00€"                            // No letters = technical

// ❌ Reported - actual user-visible text
const message = "Welcome to our app"
<button>Save changes</button>
```

**No configuration needed** for DOM APIs, Intl methods, string literal unions, styling props, or numeric strings. TypeScript + smart heuristics handle it!

### Smart Lingui Detection

The plugin uses TypeScript's symbol resolution to verify that `t`, `Trans`, `msg`, etc. actually come from Lingui packages — not just any function with the same name:

```ts
import { t } from "@lingui/macro"
const label = t`Save`  // ✅ Recognized as Lingui

// Your own function with the same name
const t = (key: string) => translations[key]
const label = t("save")  // ❌ Not confused with Lingui
```

## Features

- 🔍 Detects incorrect usage of Lingui translation macros
- 📝 Enforces simple, safe expressions inside translated messages
- 🎯 Detects missing localization of user-visible text
- 🧠 Zero-config recognition of technical strings via TypeScript types
- 🎨 Auto-ignores styling props (`*ClassName`, `*Color`, `*Style`, `*Icon`, `*Image`, `*Size`, `*Id`)
- 📦 Auto-ignores styling variables (`colorClasses`, `STATUS_COLORS`, `buttonStyles`, etc.)
- 🔧 Auto-ignores styling helper functions (`getStatusColor`, `getButtonClass`, etc.)
- 🔢 Auto-ignores numeric/symbolic strings without letters (`"1,00€"`, `"12:30"`)
- 🔒 Verifies Lingui macros actually come from `@lingui/*` packages (no false positives from similarly-named functions)

## Requirements

- Node.js ≥ 24
- ESLint ≥ 9
- TypeScript ≥ 5
- `typescript-eslint` with type-aware linting enabled

## Installation

```bash
npm install --save-dev eslint-plugin-lingui-typescript
```

## Usage

This plugin requires TypeScript and type-aware linting. Configure your `eslint.config.ts`:

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

Or configure rules manually:

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

## Rules

| Rule | Description | Recommended |
|------|-------------|:-----------:|
| [no-unlocalized-strings](docs/rules/no-unlocalized-strings.md) | Detects user-visible strings not wrapped in Lingui macros. Uses TypeScript types to automatically ignore technical strings like string literal unions, DOM APIs, and Intl methods. | ✅ |
| [no-single-variables-to-translate](docs/rules/no-single-variables-to-translate.md) | Disallows messages that consist only of variables without surrounding text. Such messages provide no context for translators. | ✅ |
| [no-single-tag-to-translate](docs/rules/no-single-tag-to-translate.md) | Disallows `<Trans>` components that contain only a single JSX element without text. The wrapped element should have surrounding text for context. | ✅ |
| [no-nested-macros](docs/rules/no-nested-macros.md) | Prevents nesting Lingui macros inside each other (e.g., `t` inside `<Trans>`). Nested macros create invalid message catalogs and confuse translators. | ✅ |
| [no-expression-in-message](docs/rules/no-expression-in-message.md) | Restricts embedded expressions to simple identifiers only. Complex expressions like `${user.name}` or `${formatPrice(x)}` must be extracted to named variables first. | ✅ |
| [t-call-in-function](docs/rules/t-call-in-function.md) | Ensures `t` macro calls are inside functions or class properties, not at module scope. Module-level calls execute before i18n is initialized and won't update on locale change. | ✅ |
| [consistent-plural-format](docs/rules/consistent-plural-format.md) | Enforces consistent plural value format — either `#` hash syntax or `${var}` template literals throughout the codebase. | ✅ |
| [text-restrictions](docs/rules/text-restrictions.md) | Enforces project-specific text restrictions with custom patterns and messages. Requires configuration. | — |

## Migrating from eslint-plugin-lingui

This plugin is a TypeScript-focused alternative to the official [eslint-plugin-lingui](https://github.com/lingui/eslint-plugin-lingui). Rule names are compatible where possible, making migration straightforward.

### Key Differences

| Feature | eslint-plugin-lingui | eslint-plugin-lingui-typescript |
|---------|---------------------|--------------------------------|
| **Type-aware detection** | ❌ Heuristics only | ✅ Uses TypeScript types |
| **String literal unions** | Manual whitelist | ✅ Auto-detected |
| **DOM API strings** | Manual whitelist | ✅ Auto-detected |
| **Intl method arguments** | Manual whitelist | ✅ Auto-detected |
| **Styling props** (`*ClassName`, etc.) | Manual whitelist | ✅ Auto-detected |
| **Styling constants** (`*_COLORS`, etc.) | Manual whitelist | ✅ Auto-detected |
| **Numeric strings** (`"1,00€"`) | Manual whitelist | ✅ Auto-detected |
| **Lingui macro verification** | Name-based only | ✅ Verifies package origin |
| **ESLint version** | 8.x | 9.x (flat config) |
| **Config format** | Legacy `.eslintrc` | Flat config only |

### Why Switch?

1. **Less configuration**: TypeScript's type system automatically identifies technical strings — no need to maintain long whitelists of ignored functions and patterns.

2. **Fewer false positives**: Strings typed as literal unions (like `"loading" | "error"`) are automatically recognized as non-translatable.

3. **Modern ESLint**: Built for ESLint 9's flat config from the ground up.

### Rule Mapping and Options Compatibility

| eslint-plugin-lingui | eslint-plugin-lingui-typescript | Options |
|---------------------|--------------------------------|---------|
| `lingui/no-unlocalized-strings` | `lingui-ts/no-unlocalized-strings` | ⚠️ Different (see below) |
| `lingui/t-call-in-function` | `lingui-ts/t-call-in-function` | ✅ None |
| `lingui/no-single-variables-to-translate` | `lingui-ts/no-single-variables-to-translate` | ✅ None |
| `lingui/no-expression-in-message` | `lingui-ts/no-expression-in-message` | ✅ None |
| `lingui/no-single-tag-to-translate` | `lingui-ts/no-single-tag-to-translate` | ✅ None |
| `lingui/text-restrictions` | `lingui-ts/text-restrictions` | ✅ Compatible (`rules`), + `minLength` |
| `lingui/consistent-plural-format` | `lingui-ts/consistent-plural-format` | ✅ Compatible (`style`) |
| `lingui/no-trans-inside-trans` | `lingui-ts/no-nested-macros` | ✅ Extended (all macros) |

### Options Changes for `no-unlocalized-strings`

The `no-unlocalized-strings` rule has different options because TypeScript types replace most manual configuration:

| Original Option | This Plugin | Notes |
|-----------------|-------------|-------|
| `useTsTypes` | — | Always enabled (TypeScript required) |
| `ignore` (array of regex) | `ignorePattern` (single regex) | Simplified |
| `ignoreFunctions` | `ignoreFunctions` | ✅ Simplified (Console/Error auto-detected) |
| `ignoreNames` (with regex support) | `ignoreNames` | Simplified (no regex, plain strings only) |
| — | `ignoreProperties` | New: separate option for JSX attributes and object properties |
| `ignoreMethodsOnTypes` | — | Not needed (TypeScript handles this automatically) |

**What you can remove from your config:**
- `useTsTypes: true` — always enabled
- Most `ignoreFunctions` entries for DOM APIs — auto-detected via types
- Most `ignoreNames` entries for typed parameters — auto-detected via types
- Most `ignoreProperties` entries (like `type`, `role`, `href`) — auto-detected via types
- `ignoreMethodsOnTypes` — handled automatically

### Migration Steps

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

5. Review your ignore lists — many entries may no longer be needed thanks to type-aware detection.

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md) before submitting a PR.

## Related Projects

- [Lingui](https://lingui.dev/) – The excellent i18n library this plugin is built for. Provides powerful macros like `t`, `<Trans>`, and `plural` for seamless internationalization.
- [eslint-plugin-lingui](https://github.com/lingui/eslint-plugin-lingui) – The official Lingui ESLint plugin. Great for JavaScript projects; this plugin extends the concept with TypeScript type-awareness.
- [typescript-eslint](https://typescript-eslint.io/) – The foundation that makes type-aware linting possible. This plugin builds on their excellent tooling.

## License

[MIT](LICENSE)

---

Made with ❤️ by [Sebastian Software](https://www.sebastian-software.de)
