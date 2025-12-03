# Contributing to eslint-plugin-lingui-typescript

First off, thanks for taking the time to contribute! 🎉

## Development Setup

### Prerequisites

- Node.js ≥ 24
- npm

### Getting Started

```bash
# Clone the repository
git clone https://github.com/sebastian-software/eslint-plugin-lingui-typescript.git
cd eslint-plugin-lingui-typescript

# Install dependencies
npm install

# Run tests
npm test

# Run linting
npm run lint

# Type check
npm run typecheck
```

## Project Structure

```
src/
├── index.ts              # Plugin entry point
├── rules/                # ESLint rule implementations
│   ├── rule-name.ts      # Rule implementation
│   └── rule-name.test.ts # Rule tests (co-located)
└── utils/                # Shared utilities
    └── create-rule.ts    # Rule factory helper
```

## Adding a New Rule

1. Create the rule file: `src/rules/my-new-rule.ts`
2. Create the test file: `src/rules/my-new-rule.test.ts`
3. Export the rule from `src/index.ts`
4. Add documentation: `docs/rules/my-new-rule.md`
5. Update `README.md` with the new rule

### Rule Template

```typescript
import { createRule } from "../utils/create-rule.js"

type MessageId = "myMessageId"

export const myNewRule = createRule<[], MessageId>({
  name: "my-new-rule",
  meta: {
    type: "suggestion",
    docs: {
      description: "Description of what the rule does"
    },
    messages: {
      myMessageId: "Error message shown to users"
    },
    schema: []
  },
  defaultOptions: [],
  create(context) {
    return {
      // AST visitor methods
    }
  }
})
```

## Code Style

- **TypeScript**: All code must be written in TypeScript
- **Prettier**: Code is auto-formatted with Prettier
- **ESLint**: Follow the project's ESLint configuration
- **No semicolons**: We use ASI (automatic semicolon insertion)
- **Double quotes**: Use double quotes for strings

The pre-commit hook will automatically format and lint your code.

## Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(rule-name): add new feature
fix(rule-name): fix bug description
docs: update documentation
refactor: improve code structure
test: add missing tests
chore: update dependencies
```

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run a specific test file
npm test -- src/rules/my-rule.test.ts
```

### Writing Tests

Tests use `@typescript-eslint/rule-tester` with Vitest:

```typescript
import { RuleTester } from "@typescript-eslint/rule-tester"
import { afterAll, describe, it } from "vitest"
import { myRule } from "./my-rule.js"

RuleTester.afterAll = afterAll
RuleTester.describe = describe
RuleTester.it = it

const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      projectService: {
        allowDefaultProject: ["*.ts", "*.tsx"]
      },
      tsconfigRootDir: import.meta.dirname
    }
  }
})

ruleTester.run("my-rule", myRule, {
  valid: [
    // Valid code examples
  ],
  invalid: [
    // Invalid code examples with expected errors
  ]
})
```

## Pull Request Process

1. Fork the repository and create your branch from `main`
2. Make your changes and add tests
3. Ensure all tests pass: `npm test`
4. Ensure linting passes: `npm run lint`
5. Ensure type checking passes: `npm run typecheck`
6. Update documentation if needed
7. Submit a pull request

### PR Checklist

- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Commit messages follow conventional commits
- [ ] All CI checks pass

## Releasing

Releases are handled by maintainers using `release-it`:

```bash
npm run release
```

This will:
1. Run all checks (lint, typecheck, test)
2. Bump the version based on conventional commits
3. Update the CHANGELOG
4. Create a git tag
5. Push to GitHub
6. Create a GitHub Release
7. Publish to npm

## Questions?

Feel free to open an issue if you have questions or need help!

