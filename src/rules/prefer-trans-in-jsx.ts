import { AST_NODE_TYPES, type TSESLint, type TSESTree } from "@typescript-eslint/utils"

import { createRule } from "../utils/create-rule.js"

type MessageId = "preferTrans"

/**
 * Checks if a t`...` node is in a "renderable" position inside JSX — i.e. the
 * path from the node to the JSXExpressionContainer only passes through
 * ConditionalExpression and LogicalExpression nodes. This ensures we only flag
 * cases where replacing t`...` with <Trans> is valid (e.g. ternaries, logical
 * AND/OR), and skip cases like function call arguments where a string is expected.
 */
function isRenderableInJSX(node: TSESTree.Node): boolean {
  let current: TSESTree.Node | undefined = node.parent
  while (current) {
    if (current.type === AST_NODE_TYPES.JSXExpressionContainer) {
      // Only renderable if the container is a JSX child, not a JSX attribute value
      return current.parent.type !== AST_NODE_TYPES.JSXAttribute
    }
    if (current.type !== AST_NODE_TYPES.ConditionalExpression && current.type !== AST_NODE_TYPES.LogicalExpression) {
      return false
    }
    current = current.parent
  }
  return false
}

/**
 * Returns a RuleFix that ensures `Trans` is imported from `@lingui/react/macro`,
 * or null if the import already exists.
 */
function ensureTransImport(
  fixer: TSESLint.RuleFixer,
  context: Readonly<TSESLint.RuleContext<MessageId, []>>
): TSESLint.RuleFix | null {
  const body = context.sourceCode.ast.body

  // Check if Trans is already imported from any Lingui package
  for (const stmt of body) {
    if (stmt.type !== AST_NODE_TYPES.ImportDeclaration) continue
    const source = stmt.source.value
    if (typeof source !== "string" || !source.includes("@lingui/")) continue

    for (const spec of stmt.specifiers) {
      if (
        spec.type === AST_NODE_TYPES.ImportSpecifier &&
        spec.imported.type === AST_NODE_TYPES.Identifier &&
        spec.imported.name === "Trans"
      ) {
        return null
      }
    }
  }

  // Check if there's an existing import from @lingui/react/macro to append to
  for (const stmt of body) {
    if (stmt.type !== AST_NODE_TYPES.ImportDeclaration) continue
    if (stmt.source.value === "@lingui/react/macro" && stmt.specifiers.length > 0) {
      const lastSpecifier = stmt.specifiers[stmt.specifiers.length - 1]
      if (lastSpecifier !== undefined) {
        return fixer.insertTextAfter(lastSpecifier, ", Trans")
      }
    }
  }

  // Insert a new import before the first statement
  const firstStatement = body[0]
  if (firstStatement !== undefined) {
    return fixer.insertTextBefore(firstStatement, 'import { Trans } from "@lingui/react/macro"\n')
  }

  return null
}

/**
 * Build JSX content from a tagged template's quasis and expressions.
 * Template literal quasis become JSX text, expressions become {expr} JSX expression containers.
 */
function buildTransContent(node: TSESTree.TaggedTemplateExpression, sourceCode: Readonly<TSESLint.SourceCode>): string {
  const { quasis, expressions } = node.quasi
  let result = ""
  for (let i = 0; i < quasis.length; i++) {
    const quasi = quasis[i]
    if (quasi) result += quasi.value.raw
    if (i < expressions.length) {
      const expr = expressions[i]
      if (expr) result += `{${sourceCode.getText(expr)}}`
    }
  }
  return result
}

export const preferTransInJsx = createRule<[], MessageId>({
  name: "prefer-trans-in-jsx",
  meta: {
    type: "suggestion",
    docs: {
      description: "Prefer `<Trans>` over `{t`...`}` in JSX"
    },
    fixable: "code",
    messages: {
      preferTrans:
        "Prefer `<Trans>` over `{t\\`...\\`}` in JSX. The `<Trans>` component is the idiomatic way to handle translations in JSX."
    },
    schema: []
  },
  defaultOptions: [],
  create(context) {
    return {
      TaggedTemplateExpression(node): void {
        if (node.tag.type !== AST_NODE_TYPES.Identifier || node.tag.name !== "t") {
          return
        }

        const parent = node.parent

        // Case 1: Direct — t`...` is the expression inside a JSXExpressionContainer
        // Only when the container is a child of a JSX element (not a JSX attribute value)
        if (
          parent.type === AST_NODE_TYPES.JSXExpressionContainer &&
          parent.parent.type !== AST_NODE_TYPES.JSXAttribute
        ) {
          const content = buildTransContent(node, context.sourceCode)
          context.report({
            node,
            messageId: "preferTrans",
            fix(fixer) {
              const fixes: TSESLint.RuleFix[] = []
              fixes.push(fixer.replaceText(parent, `<Trans>${content}</Trans>`))

              const importFix = ensureTransImport(fixer, context)
              if (importFix !== null) fixes.push(importFix)

              return fixes
            }
          })
          return
        }

        // Case 2: Nested — t`...` inside a renderable JSX expression (ternary, logical)
        if (isRenderableInJSX(node)) {
          const content = buildTransContent(node, context.sourceCode)
          context.report({
            node,
            messageId: "preferTrans",
            fix(fixer) {
              const fixes: TSESLint.RuleFix[] = []
              fixes.push(fixer.replaceText(node, `<Trans>${content}</Trans>`))

              const importFix = ensureTransImport(fixer, context)
              if (importFix !== null) fixes.push(importFix)

              return fixes
            }
          })
        }
      }
    }
  }
})
