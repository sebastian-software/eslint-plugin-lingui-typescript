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
    "lingui-ts/no-unlocalized-strings": "warn",
    "lingui-ts/no-single-variable-message": "error"
  }
}
```

## Rules

| Rule | Description | Recommended |
|------|-------------|:-----------:|
| [consistent-plural-format](docs/rules/consistent-plural-format.md) | Ensure consistent plural usage | ✅ |
| [no-complex-expressions-in-message](docs/rules/no-complex-expressions-in-message.md) | Restrict complexity of expressions in messages | ✅ |
| [no-nested-macros](docs/rules/no-nested-macros.md) | Disallow nesting Lingui macros | ✅ |
| [no-single-tag-message](docs/rules/no-single-tag-message.md) | Disallow messages with only a single markup tag | ✅ |
| [no-single-variable-message](docs/rules/no-single-variable-message.md) | Disallow messages that consist only of a single variable | ✅ |
| [no-unlocalized-strings](docs/rules/no-unlocalized-strings.md) | Detect unlocalized user-visible strings | ⚠️ |
| [valid-t-call-location](docs/rules/valid-t-call-location.md) | Enforce `t` calls inside functions | ✅ |

### Optional Rules

| Rule | Description |
|------|-------------|
| [text-restrictions](docs/rules/text-restrictions.md) | Enforce project-specific text restrictions |

## License

[MIT](LICENSE)
