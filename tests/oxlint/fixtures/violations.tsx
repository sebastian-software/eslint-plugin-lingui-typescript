/**
 * OXLint Compatibility Smoke Test Fixtures
 *
 * Each section contains code that SHOULD trigger a specific rule violation.
 * Rules that require TypeScript type-checking are excluded.
 */

// === lingui-typescript/no-nested-macros ===
// t inside t is not allowed
const nested = t`foo ${t`bar`}`

// === lingui-typescript/t-call-in-function ===
// t at module top-level is not allowed
const topLevel = t`Hello`

// === lingui-typescript/no-single-variables-to-translate ===
// Translating only a variable provides no context for translators
const singleVar = t`${status}`

// === lingui-typescript/no-single-tag-to-translate ===
// Wrapping only a JSX element provides no translatable text
function SingleTag() {
  return (
    <Trans>
      <Button />
    </Trans>
  )
}

// === lingui-typescript/no-expression-in-message ===
// Complex expressions should be extracted to named variables
const complexExpr = t`Hello ${user.name}`

// === lingui-typescript/consistent-plural-format ===
// Default style is "hash" - using template variable instead of # should error
import { plural } from "@lingui/macro"
const inconsistent = plural(numBooks, {
  one: `${numBooks} book`,
  other: `${numBooks} books`
})
