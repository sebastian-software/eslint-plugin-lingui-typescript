# eslint-plugin-lingui-typescript

[![npm version](https://img.shields.io/npm/v/eslint-plugin-lingui-typescript.svg)](https://www.npmjs.com/package/eslint-plugin-lingui-typescript)
[![CI](https://github.com/user/eslint-plugin-lingui-typescript/actions/workflows/ci.yml/badge.svg)](https://github.com/user/eslint-plugin-lingui-typescript/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

ESLint plugin for [Lingui](https://lingui.dev/) with TypeScript type-aware rules.

## Features

- 🔍 Detects incorrect usage of Lingui translation macros
- 📝 Enforces simple, safe expressions inside translated messages
- 🎯 Detects missing localization of user-visible text
- 🧠 Uses TypeScript types to distinguish UI text from technical strings

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
    "lingui-ts/no-single-variable-message": "error"
  }
}
```

## Rules

| Rule | Description | Recommended |
|------|-------------|:-----------:|
| [no-unlocalized-strings](docs/rules/no-unlocalized-strings.md) | Detects user-visible strings not wrapped in Lingui macros. Uses TypeScript types to automatically ignore technical strings like string literal unions, DOM APIs, Intl methods, and discriminated union fields. | ✅ |
| [no-single-variable-message](docs/rules/no-single-variable-message.md) | Disallows messages that consist only of a single variable without surrounding text. Such messages provide no context for translators. | ✅ |
| [no-single-tag-message](docs/rules/no-single-tag-message.md) | Disallows `<Trans>` components that contain only a single JSX element without text. The wrapped element should be translated directly instead. | ✅ |
| [no-nested-macros](docs/rules/no-nested-macros.md) | Prevents nesting Lingui macros inside each other (e.g., `t` inside `<Trans>`). Nested macros create invalid message catalogs and confuse translators. | ✅ |
| [no-complex-expressions-in-message](docs/rules/no-complex-expressions-in-message.md) | Restricts embedded expressions in messages to simple identifiers and member access. Complex expressions like function calls or ternaries should be extracted to variables. | ✅ |
| [valid-t-call-location](docs/rules/valid-t-call-location.md) | Ensures `t` macro calls are inside functions, not at module scope. Module-level calls execute before i18n is initialized and won't update on locale change. | ✅ |
| [consistent-plural-format](docs/rules/consistent-plural-format.md) | Validates `<Plural>` component usage by ensuring required plural keys (`one`, `other`) are present. Helps maintain consistent pluralization across the codebase. | ✅ |
| [text-restrictions](docs/rules/text-restrictions.md) | Enforces project-specific text restrictions like disallowed patterns or minimum length. Requires configuration to be useful. | — |

## License

[MIT](LICENSE)
