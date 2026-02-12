#!/usr/bin/env bash
#
# OXLint Compatibility Smoke Test
#
# Tests whether eslint-plugin-lingui-typescript can be loaded
# by OXLint via its jsPlugins feature. This is experimental
# and expected to evolve as OXLint matures.
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "=== OXLint Compatibility Smoke Test ==="
echo ""

# Resolve oxlint binary (global install or npx fallback)
if command -v oxlint &> /dev/null; then
  OXLINT="oxlint"
else
  OXLINT="npx oxlint"
fi

echo "OXLint version: $($OXLINT --version)"
echo ""

# Ensure plugin is built
if [ ! -f "$PROJECT_ROOT/dist/index.js" ]; then
  echo "Building plugin..."
  cd "$PROJECT_ROOT"
  npm run build
  echo ""
fi

# Define rules to test (all rules except no-unlocalized-strings which requires type-checking)
RULES=(
  "lingui-typescript/no-nested-macros"
  "lingui-typescript/t-call-in-function"
  "lingui-typescript/no-single-variables-to-translate"
  "lingui-typescript/no-single-tag-to-translate"
  "lingui-typescript/no-expression-in-message"
  "lingui-typescript/consistent-plural-format"
  "lingui-typescript/prefer-trans-in-jsx"
  "lingui-typescript/text-restrictions"
)

# Run oxlint and capture output (oxlint exits non-zero when it finds violations)
echo "Running oxlint against test fixtures..."
echo ""

OUTPUT=$(cd "$SCRIPT_DIR" && $OXLINT --config .oxlintrc.json fixtures/ 2>&1) || true

echo "$OUTPUT"
echo ""
echo "========================================="
echo "=== Compatibility Results ==="
echo "========================================="
echo ""

PASS=0
FAIL=0

for rule in "${RULES[@]}"; do
  # OXLint formats rules as "plugin(rule-name)" instead of "plugin/rule-name"
  PLUGIN="${rule%%/*}"
  RULE_NAME="${rule#*/}"
  PATTERN="${PLUGIN}(${RULE_NAME})"

  if echo "$OUTPUT" | grep -qF "$PATTERN"; then
    echo "  PASS  $rule"
    ((PASS++))
  else
    echo "  FAIL  $rule"
    ((FAIL++))
  fi
done

TOTAL=${#RULES[@]}

echo ""
echo "Summary: $PASS/$TOTAL rules detected"
echo ""

if [ "$FAIL" -eq "$TOTAL" ]; then
  echo "No rules detected - plugin failed to load."
  echo "This may be expected if OXLint jsPlugins does not yet support"
  echo "@typescript-eslint/utils or ESM plugin resolution."
  exit 1
elif [ "$FAIL" -gt 0 ]; then
  echo "Partial compatibility: $PASS of $TOTAL rules working."
  exit 0
else
  echo "Full compatibility: All tested rules working!"
  exit 0
fi
