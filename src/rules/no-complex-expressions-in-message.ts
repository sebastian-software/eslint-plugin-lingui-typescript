import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils"

import { createRule } from "../utils/create-rule.js"

type MessageId = "complexExpression" | "legacyPlaceholder"

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Checks if an expression is allowed within a Lingui message.
 *
 * ONLY simple identifiers are allowed: ${name}, ${count}, ${formattedPrice}
 *
 * Everything else must be extracted to a named variable first.
 * This ensures translators always see meaningful placeholder names.
 *
 * Note: plural(), select(), selectOrdinal() are NOT allowed inside t`...`
 * Use the JSX components <Plural>, <Select>, <SelectOrdinal> instead,
 * or ICU message syntax in your catalog.
 */
function isAllowedExpression(node: TSESTree.Expression): boolean {
  return node.type === AST_NODE_TYPES.Identifier
}

/**
 * Returns a human-readable description of an expression type for error messages.
 */
function describeExpression(node: TSESTree.Expression): string {
  switch (node.type) {
    case AST_NODE_TYPES.BinaryExpression:
      return `binary expression (${node.operator})`
    case AST_NODE_TYPES.CallExpression:
      return "function call"
    case AST_NODE_TYPES.MemberExpression:
      return "member expression"
    case AST_NODE_TYPES.ConditionalExpression:
      return "conditional expression"
    case AST_NODE_TYPES.LogicalExpression:
      return `logical expression (${node.operator})`
    case AST_NODE_TYPES.UnaryExpression:
      return `unary expression (${node.operator})`
    case AST_NODE_TYPES.TemplateLiteral:
      return "template literal"
    case AST_NODE_TYPES.ArrayExpression:
      return "array expression"
    case AST_NODE_TYPES.ObjectExpression:
      return "object expression"
    default:
      return node.type
  }
}

/**
 * Checks if an expression is JSX whitespace like {' '} or {` `}.
 * These are commonly used for spacing in JSX and should be allowed.
 */
function isWhitespaceExpression(expr: TSESTree.Expression): boolean {
  if (expr.type === AST_NODE_TYPES.Literal && typeof expr.value === "string") {
    return expr.value.trim() === ""
  }
  if (expr.type === AST_NODE_TYPES.TemplateLiteral) {
    const fullText = expr.quasis.map((q) => q.value.raw).join("")
    return fullText.trim() === ""
  }
  return false
}

// ============================================================================
// Rule Definition
// ============================================================================

export const noComplexExpressionsInMessage = createRule<[], MessageId>({
  name: "no-complex-expressions-in-message",
  meta: {
    type: "problem",
    docs: {
      description: "Disallow complex expressions in Lingui messages - only simple identifiers are allowed"
    },
    messages: {
      complexExpression:
        "Extract '{{expression}}' to a named variable. Translators need meaningful placeholder names, not code.",
      legacyPlaceholder:
        "Legacy placeholder syntax is not supported. Use simple variables like ${name} instead of object expressions."
    },
    schema: []
  },
  defaultOptions: [],
  create(context) {
    /**
     * Checks a single expression and reports if it's not allowed.
     */
    function checkExpression(expr: TSESTree.Expression): void {
      // Legacy placeholder syntax: ${{name: value}}
      if (expr.type === AST_NODE_TYPES.ObjectExpression) {
        context.report({
          node: expr,
          messageId: "legacyPlaceholder"
        })
        return
      }

      if (!isAllowedExpression(expr)) {
        context.report({
          node: expr,
          messageId: "complexExpression",
          data: { expression: describeExpression(expr) }
        })
      }
    }

    /**
     * Checks all expressions in a tagged template: t`Hello ${expr}`
     */
    function checkTemplateExpressions(expressions: TSESTree.Expression[]): void {
      for (const expr of expressions) {
        checkExpression(expr)
      }
    }

    /**
     * Checks all expression children in a JSX element: <Trans>Hello {expr}</Trans>
     */
    function checkJSXExpressionChildren(children: TSESTree.JSXChild[]): void {
      for (const child of children) {
        if (child.type !== AST_NODE_TYPES.JSXExpressionContainer) {
          continue
        }
        if (child.expression.type === AST_NODE_TYPES.JSXEmptyExpression) {
          continue
        }
        // Allow whitespace: {' '}, {` `}
        if (isWhitespaceExpression(child.expression)) {
          continue
        }
        checkExpression(child.expression)
      }
    }

    return {
      TaggedTemplateExpression(node): void {
        // Only check t`...`, not css`...` etc.
        if (node.tag.type !== AST_NODE_TYPES.Identifier || node.tag.name !== "t") {
          return
        }
        checkTemplateExpressions(node.quasi.expressions)
      },

      JSXElement(node): void {
        // Only check <Trans>...</Trans>
        const name = node.openingElement.name
        if (name.type !== AST_NODE_TYPES.JSXIdentifier || name.name !== "Trans") {
          return
        }
        checkJSXExpressionChildren(node.children)
      }
    }
  }
})
