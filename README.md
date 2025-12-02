# eslint-plugin-lingui-typescript

[![npm version](https://img.shields.io/npm/v/eslint-plugin-lingui-typescript.svg)](https://www.npmjs.com/package/eslint-plugin-lingui-typescript)
[![CI](https://github.com/user/eslint-plugin-lingui-typescript/actions/workflows/ci.yml/badge.svg)](https://github.com/user/eslint-plugin-lingui-typescript/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

ESLint plugin for [Lingui](https://lingui.dev/) with TypeScript type-aware rules.

## Features

- 🔍 Detects incorrect usage of Lingui translation macros
- 📝 Enforces simple, safe expressions inside translated messages
- 🎯 Detects missing localization of user-visible text
- 🧠 Respects TypeScript types to avoid false positives (e.g. string literal unions)

## Requirements

- Node.js ≥ 24
- ESLint ≥ 9
- TypeScript ≥ 5 (optional, for type-aware rules)

## Installation

```bash
npm install --save-dev eslint-plugin-lingui-typescript
```

## Usage

### ESLint Flat Config (eslint.config.ts)

```ts
import linguiPlugin from "eslint-plugin-lingui-typescript"

export default [
  // Use recommended config
  linguiPlugin.configs["flat/recommended"],

  // Or configure rules manually
  {
    plugins: {
      "lingui-ts": linguiPlugin
    },
    rules: {
      "lingui-ts/no-single-variable-message": "error"
    }
  }
]
```

## Rules

| Rule | Description | Recommended |
|------|-------------|:-----------:|
| [no-nested-macros](docs/rules/no-nested-macros.md) | Disallow nesting Lingui macros | ✅ |
| [no-single-tag-message](docs/rules/no-single-tag-message.md) | Disallow messages with only a single markup tag | ✅ |
| [no-single-variable-message](docs/rules/no-single-variable-message.md) | Disallow messages that consist only of a single variable | ✅ |

### Planned Rules

- `no-complex-expressions-in-message` — Restrict complexity of expressions in messages
- `valid-t-call-location` — Enforce valid locations for `t` macro calls
- `no-unlocalized-strings` — Detect user-visible strings not wrapped in Lingui
- `text-restrictions` — Enforce project-specific text restrictions
- `consistent-plural-format` — Ensure consistent plural usage

## License

[MIT](LICENSE)

