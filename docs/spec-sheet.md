Below is a self-contained requirements spec in English, structured and phrased so an LLM can implement the plugin directly, with minimal external research.

---

# Requirements Specification: ESLint Plugin for Lingui

## 1. Goal

Provide an ESLint plugin for Lingui that:

* Detects incorrect usage of Lingui translation macros/components.
* Enforces simple, safe expressions inside translated messages.
* Detects missing localization of user-visible text.
* Respects TypeScript types, especially string-literal unions and `as const`, to avoid false positives (e.g. technical literals for `useState`).

---

## 2. Environment and General Constraints

1. **Runtime**

   * MUST support Node.js ≥ 18.
2. **ESLint**

   * MUST support ESLint v9 with Flat Config.
   * SHOULD support legacy `.eslintrc` configuration (optional).
3. **Language and Tooling**

   * Plugin implementation MUST be in TypeScript.
   * TypeScript compiler options MUST enable `strict` mode.
4. **AST / Parser**

   * The plugin MUST support:

     * `.js`, `.jsx`, `.ts`, `.tsx`.
   * The plugin MUST work with `@typescript-eslint/parser` and use `parserServices` when available.
5. **Performance and Stability**

   * Rules MUST NOT crash when `parserServices.program` or `typeChecker` are missing.
   * In absence of type information, rules MUST degrade gracefully (e.g. skip TS-dependent checks) without throwing exceptions.

---

## 3. Concepts and Definitions

1. **Lingui Macros / APIs**

   * Tagged template macro: `t\`...``.
   * Message helpers: `msg({ message: "..." })`, `defineMessage({ message: "..." })` (exact naming configurable).
   * JSX component: `<Trans>...</Trans>`.
   * Function-style API examples: `i18n._(msg\`...`)`, `i18n.t("...")` (exact set configurable).
2. **Message Context**

   * A “message” is any string or template used in a Lingui macro or API call, e.g. `t\`...``, `<Trans>...</Trans>`, `msg({ message: "..." })`.
3. **Host Expressions**

   * Expressions inside a message, e.g.:

     * Interpolations in template literals: `t\`Hello ${expr}``.
     * JSX expressions: `<Trans>Hello {expr}</Trans>`.
4. **Technical vs. UI Strings**

   * **UI string**: text intended for end-users, e.g. button labels, error messages.
   * **Technical string**: text used only as identifiers, discriminators or internal keys (e.g. union-type literals, Redux action types).

---

## 4. Plugin Export Structure

1. The plugin MUST export a default object (ES module) with:

   * `rules: Record<string, RuleModule>`.
   * `configs: { "flat/recommended": FlatConfig[] }` (array or single config, depending on ESLint v9 conventions).
2. Flat Config usage MUST be possible like:

```ts
import linguiPlugin from "eslint-plugin-lingui";

export default [
  linguiPlugin.configs["flat/recommended"],
  {
    rules: {
      "lingui/no-unlocalized-strings": ["error", { /* options */ }],
    },
  },
];
```

---

## 5. Rules Overview

The plugin MUST provide at least the following rules (names can be exactly as below):

1. `lingui/no-complex-expressions-in-message`
2. `lingui/no-nested-macros`
3. `lingui/no-single-variable-message`
4. `lingui/no-single-tag-message`
5. `lingui/valid-t-call-location`
6. `lingui/no-unlocalized-strings`
7. `lingui/text-restrictions`
8. `lingui/consistent-plural-format`

Each rule MUST:

* Be implemented as an ESLint rule module (with `meta` and `create`).
* Provide `meta.docs.description`, `meta.type` (“problem” or “suggestion”), and `meta.schema`.
* Have test coverage as specified in Section 8.

---

## 6. Detailed Rule Requirements

### 6.1 `lingui/no-complex-expressions-in-message`

**Purpose:** Restrict complexity of expressions embedded in Lingui messages.

**Scope:**

* Tagged templates: `t\`...``.
* JSX: `<Trans>...</Trans>`.
* Other configured macros/APIs (see configuration below).

**Behavior:**

1. For each message, inspect all embedded expressions:

   * Template interpolation (`TemplateLiteral.expressions`).
   * JSX expressions (`JSXExpressionContainer` inside `<Trans>`).
2. The following expressions MUST be allowed:

   * Simple identifiers:

     * `Identifier`: `name`, `count`.
   * Optionally (configurable) simple member expressions of depth 1:

     * `MemberExpression` where object is `Identifier` and property is `Identifier` (e.g. `props.name`).
   * Whitelisted Lingui helper calls, for example:

     * `i18n.number(value)`
     * `i18n.date(value)`
     * Plural/select helpers (exact names configurable).
3. The following expressions MUST be reported as violations:

   * Function calls not in the allowed helper list:

     * `CallExpression` where callee is not whitelisted, e.g. `Math.random()`, `formatDate(date)`.
   * Deep member expressions (depth > 1 or optional chains), for example:

     * `user.address.street`, `a?.b?.c`.
   * Binary/arithmetical expressions:

     * `price * 1.2`, `items.join(", ")`.
   * Any other expression type not explicitly allowed.
4. Each offending expression MUST produce a separate ESLint report.

**Configuration (Options):**

* Default export name: `"lingui/no-complex-expressions-in-message": "error"` in recommended config.
* Options object fields (optional):

  * `allowedCallees: string[]`
    Format: dot-separated string, e.g. `"i18n.number"`, `"i18n.date"`.
  * `allowMemberExpressions: boolean`
    Default: `false`.
  * `maxExpressionDepth: number | null`
    If `maxExpressionDepth` is set, member expressions with depth > this value MUST be reported.

---

### 6.2 `lingui/no-nested-macros`

**Purpose:** Disallow nesting of Lingui macros inside other Lingui macros.

**Scope:**

* Any configured Lingui macro or JSX component:

  * `t\`...``, `<Trans>...</Trans>`, `msg`, `defineMessage`, etc.

**Behavior:**

1. For every usage of a Lingui macro:

   * `t\`...``
   * `<Trans>...</Trans>`
   * `msg({ message: ... })`, `defineMessage({ message: ... })`
   * Any additional configured macro/component.
2. Within the message content or children:

   * If any *other* Lingui macro usage is found *inside* the current macro, this MUST be reported.
3. The simplest form of nesting MUST be detected:

   * `t\`foo ${t`bar`}``.
   * `<Trans><Trans>Inner</Trans></Trans>`.
   * `<Trans>{t\`Hello`}</Trans>`.
   * `msg({ message: t\`Hello` })`.

**Configuration (Options):**

* `macros: string[]` (default: `["t", "Trans", "msg", "defineMessage"]`).
* `allowDifferentMacros: boolean`:

  * If `false`: any macro inside any macro is forbidden.
  * If `true`: only identical macro nesting is forbidden (e.g. `t` inside `t` is error; `t` inside `Trans` is allowed).

---

### 6.3 `lingui/no-single-variable-message`

**Purpose:** Discourage messages that consist only of a single variable/placeholder.

**Scope:**

* `t\`...``.
* `<Trans>...</Trans>`.
* Other configured macros.

**Behavior:**

1. A message MUST be reported if:

   * It contains exactly one placeholder expression, and
   * It contains no plain text (no literal text nodes or raw text segments).
2. Examples that MUST be reported:

   * `t\`${status}``.
   * `<Trans>{label}</Trans>`.
3. Messages that have additional text or structure MUST NOT be reported:

   * `t\`Status: ${status}``.
   * `<Trans>Hello {name}</Trans>`.

**Configuration (Options):**

* No required options. Optional future options: whitelist of variables.

---

### 6.4 `lingui/no-single-tag-message`

**Purpose:** Discourage messages that consist only of a single markup tag without surrounding text.

**Scope:** `<Trans>...</Trans>` and other JSX-based translation components.

**Behavior:**

1. `<Trans>` MUST be reported if:

   * It has exactly one child `JSXElement` or `JSXFragment`, and
   * There is no accompanying text.
2. Examples that MUST be reported:

   * `<Trans><a href="/terms">Terms</a></Trans>`.
3. Non-violations:

   * `<Trans>Read <a href="/terms">terms</a></Trans>`.
   * `<Trans><strong>Important:</strong> {message}</Trans>` when there is text around.

**Configuration (Options):**

* None required.

---

### 6.5 `lingui/valid-t-call-location`

**Purpose:** Enforce valid locations for `t` macro calls to avoid issues like evaluation order, side effects, or extraction problems.

**Scope:**

* Tagged template macro `t\`...``.
* Optionally, other configured macros/APIs.

**Behavior:**

1. The rule MUST report `t` usage at top-level module scope:

   * Example of violation:

     ```ts
     const msg = t`Hello`;
     ```
2. The rule MUST allow `t` usage inside:

   * Functions (including React components).
   * Hooks.
   * Event handlers and callbacks.
3. The rule MUST be configurable to:

   * Optionally allow `t` inside certain patterns if the user configures them.

**Configuration (Options):**

* `allowedTopLevel: boolean` (default: `false`).
* `allowedContexts: ("function" | "arrowFunction" | "classMethod" | "hook")[]`.

---

### 6.6 `lingui/no-unlocalized-strings`

**Purpose:** Detect user-visible strings that are *not* handled by Lingui translation macros/APIs, while ignoring technical strings.

**Scope:**

* String literals and template literals in:

  * JavaScript / TypeScript code.
  * JSX text and `JSXAttribute` values.

**Core Behavior (Language-agnostic):**

1. The rule MUST identify candidate strings that appear to be UI strings:

   * E.g. `"Save changes"`, `"Error loading data"`, plain JSX text `Something went wrong`.
2. The rule MUST NOT report strings that:

   * Are already inside Lingui message contexts (`t`, `<Trans>`, `msg`, `defineMessage`, etc.).
   * Match user-configured ignore patterns (e.g. for test IDs or technical keys).
3. The rule MUST have configuration options to specify:

   * Functions where string arguments should be ignored.
   * Variable names to ignore.
   * Property / attribute names to ignore.

**TypeScript-Aware Behavior (Key requirement):**

When TypeScript type information is available:

4. The rule MUST NOT report string literals that are used purely as technical values based on string-literal types, such as:

   * Union type definitions:

     ```ts
     type Status = "idle" | "loading" | "error";
     ```
   * Initializers where the variable type is a string-literal union:

     ```ts
     type Status = "idle" | "loading" | "error";
     const [status, setStatus] = useState<Status>("idle");
     // "idle" MUST NOT be reported.
     ```
   * Values marked with `as const` used as discriminators:

     ```ts
     const ACTION_SAVE = "save" as const;
     type Action = { type: typeof ACTION_SAVE };
     const action: Action = { type: ACTION_SAVE };
     // "save" MUST NOT be reported.
     ```
   * Discriminated unions:

     ```ts
     type Action =
       | { type: "save" }
       | { type: "cancel" };

     const action: Action = { type: "save" };
     // "save" and "cancel" MUST NOT be reported.
     ```

5. Detection algorithm (TypeScript mode):

   For each string literal node `S`:

   * Obtain its TypeScript type `T` via `typeChecker.getTypeAtLocation(S)` if `parserServices.program` exists.
   * If `T` is a string literal type or a union of string literals, and:

     * `S` is used in one of the following contexts:

       * Type alias declaration.
       * Typed initialization of state or discriminated union.
       * Property assignment for a `type` or `kind` field in a union.
     * THEN `S` MUST be treated as **technical** and MUST NOT be reported.

6. Fallback behavior if TypeScript info is missing:

   * The rule MUST still run using syntactic heuristics only.
   * It MUST NOT throw and MUST NOT assume type information.
   * Implementation MAY skip TS-aware exclusions.

**Configuration (Options):**

* `tsAwareMode: "off" | "basic" | "strict"`:

  * `"off"`: ignore TypeScript types entirely (JS-only behavior).
  * `"basic"`: use type info if available, otherwise heuristics.
  * `"strict"` (default for TS projects): rely on TypeScript `typeChecker` where available.
* `ignoreFunctions: string[]`
  Example: `["test", "it", "describe"]`.
* `ignoreVariables: string[]`
  Example: `["__DEV__", "DEBUG_TAG"]`.
* `ignoreProperties: string[]`
  Example: `["data-testid", "id", "key"]`.
* `ignorePattern: string | null`
  Regex string applied to literals to skip (e.g. keys with underscores).

---

### 6.7 `lingui/text-restrictions`

**Purpose:** Enforce project-specific restrictions on message text content.

**Scope:**

* Only within Lingui messages (e.g. `t`, `<Trans>`, `msg`, `defineMessage`).

**Behavior:**

1. For each Lingui message string:

   * Apply configured restrictions to the raw text, ignoring placeholders.
2. The following checks MUST be supported via configuration:

   * Disallow specific characters or regex patterns (e.g. HTML entities, `\n`).
   * Optionally enforce minimum length (e.g. disallow 1-character messages).

**Configuration (Options):**

* `forbiddenPatterns: string[]` (regex strings).
* `minLength: number | null`.

---

### 6.8 `lingui/consistent-plural-format`

**Purpose:** Ensure consistent plural usage in messages.

**Scope:**

* Lingui plural/select helpers in messages, e.g. `plural(value, { one: "...", other: "..." })` or equivalent patterns.

**Behavior:**

1. The rule MUST validate that whenever a plural helper is used:

   * Required plural keys are present (e.g. at least `other`).
   * Project-defined required keys are present (e.g. `one`, `other`, optionally `zero`).
2. The rule MUST report missing required plural keys.

**Configuration (Options):**

* `requiredKeys: string[]`
  Example: `["one", "other"]`.

---

## 7. Documentation Requirements

For each rule, the plugin MUST provide a Markdown file (e.g. `docs/rules/<rule-name>.md`) with:

1. Short description of what the rule does.
2. At least one minimal **invalid** code example.
3. At least one minimal **valid** code example.
4. Explanation of configuration options with default values.

README MUST include:

* Installation instructions.
* Flat Config usage example.
* List of rules and which are enabled by `"flat/recommended"`.

---

## 8. Test Requirements

### 8.1 General Testing

1. Tests MUST be written in TypeScript or JavaScript using a test runner (e.g. Jest or Vitest).
2. Each rule MUST have its own test file (e.g. `no-complex-expressions-in-message.test.ts`).
3. Tests MUST use ESLint’s `RuleTester` (or equivalent from `@typescript-eslint/utils`) to define:

   * `valid` cases where no errors are reported.
   * `invalid` cases where:

     * The correct rule ID is reported.
     * Expected messages (or `messageId`) are asserted.
     * Expected node locations are asserted (at least basic checks).
4. The entire test suite MUST run without errors under Node.js ≥ 18.

### 8.2 Rule-Specific Test Cases

**For `no-complex-expressions-in-message`:**

* Valid:

  * `t\`Hello ${name}``.
  * `<Trans>Hello {name}</Trans>`.
  * `<Trans>Last login on {i18n.date(lastLogin)}</Trans>` (if `i18n.date` is whitelisted).
* Invalid:

  * `t\`Hello ${user.name}`` (if deep member not allowed).
  * `<Trans>Hello {Math.random()}</Trans>`.
  * `<Trans>Price: {price * 1.2}</Trans>`.
* Multi-expression messages where each offending expression produces a distinct error.

**For `no-nested-macros`:**

* Invalid:

  * `t\`foo ${t`bar`}``.
  * `<Trans><Trans>Inner</Trans></Trans>`.
  * `<Trans>{t\`Hello`}</Trans>`.
* Valid:

  * Distinct, non-nested uses of macros in separate nodes.

**For `no-single-variable-message`:**

* Invalid:

  * `t\`${status}``.
  * `<Trans>{label}</Trans>`.
* Valid:

  * `t\`Status: ${status}``.
  * `<Trans>Hello {name}</Trans>`.

**For `no-single-tag-message`:**

* Invalid:

  * `<Trans><a href="/x">Link</a></Trans>`.
* Valid:

  * `<Trans>Read <a href="/x">more</a></Trans>`.

**For `valid-t-call-location`:**

* Invalid:

  * Top-level `const msg = t\`Hello`;`when`allowedTopLevel`is`false`.
* Valid:

  * `function Component() { const msg = t\`Hello`; }`.

**For `no-unlocalized-strings`:**

*JS/JSX:*

* Invalid:

  * `const label = "Save changes";` (used as UI text).
  * `<button>Save changes</button>`.
* Valid:

  * Strings inside `t`, `<Trans>`, etc.
  * Strings in ignored functions/variables/properties according to config.

*TS-aware:*

* Valid (must NOT report):

  * `type Status = "idle" | "loading" | "error";`
  * `const [status, setStatus] = useState<Status>("idle");`
  * `const action: Action = { type: "save" };` where `Action` is a discriminated union.
  * `const ACTION_SAVE = "save" as const;`
* Invalid (must report):

  * `const buttonLabel = "Save changes";` used in JSX.
* Tests MUST include a scenario where TypeScript `program` is not provided (e.g. missing `parserOptions.project`) to ensure the rule does not crash.

**For `text-restrictions`:**

* Invalid:
  * Message containing forbidden pattern (e.g. `"Hello\nWorld"` when `\n` is forbidden).
* Valid:
  * Messages without forbidden patterns.

**For `consistent-plural-format`:**

* Invalid:
  * Plural call missing required keys.
* Valid:
  * Plural call with all configured `requiredKeys`.
