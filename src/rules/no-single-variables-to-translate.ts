import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils"

import { createRule } from "../utils/create-rule.js"

type MessageId = "singleVariable"

/**
 * Checks if a tagged template has only a single expression and no text content.
 */
function isSingleVariableTemplate(node: TSESTree.TemplateLiteral): boolean {
  // Must have exactly one expression
  if (node.expressions.length !== 1) {
    return false
  }

  // All quasis must be empty (no text content)
  return node.quasis.every((quasi) => quasi.value.raw.trim() === "")
}

/**
 * Checks if a JSX expression is whitespace: {' '} or {` `}
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

/**
 * Checks if a JSX element has only expression children and no text content.
 * This includes single expressions or multiple expressions with whitespace.
 */
function isOnlyVariablesJSX(children: TSESTree.JSXChild[]): boolean {
  const meaningfulChildren = children.filter((child) => {
    if (child.type === AST_NODE_TYPES.JSXText) {
      return child.value.trim() !== ""
    }
    // Whitespace expressions like {' '} don't count as meaningful
    if (
      child.type === AST_NODE_TYPES.JSXExpressionContainer &&
      child.expression.type !== AST_NODE_TYPES.JSXEmptyExpression &&
      isWhitespaceExpression(child.expression)
    ) {
      return false
    }
    return true
  })

  // No meaningful children (or all whitespace) - this is caught by other rules
  if (meaningfulChildren.length === 0) {
    return false
  }

  // All meaningful children must be expression containers (no text)
  return meaningfulChildren.every((child) => child.type === AST_NODE_TYPES.JSXExpressionContainer)
}

/**
 * Checks if a JSX element has the `id` prop (lazy translation lookup).
 */
function hasIdProp(openingElement: TSESTree.JSXOpeningElement): boolean {
  return openingElement.attributes.some(
    (attr) =>
      attr.type === AST_NODE_TYPES.JSXAttribute &&
      attr.name.type === AST_NODE_TYPES.JSXIdentifier &&
      attr.name.name === "id"
  )
}

export const noSingleVariablesToTranslate = createRule<[], MessageId>({
  name: "no-single-variables-to-translate",
  meta: {
    type: "problem",
    docs: {
      description: "Disallow Lingui messages that consist only of a single variable"
    },
    messages: {
      singleVariable:
        "Translation message should not consist only of a single variable. Add surrounding text for context."
    },
    schema: []
  },
  defaultOptions: [],
  create(context) {
    return {
      // Check t`${variable}` pattern
      TaggedTemplateExpression(node): void {
        if (node.tag.type !== AST_NODE_TYPES.Identifier || node.tag.name !== "t") {
          return
        }

        if (isSingleVariableTemplate(node.quasi)) {
          context.report({
            node,
            messageId: "singleVariable"
          })
        }
      },

      // Check <Trans>{variable}</Trans> pattern
      JSXElement(node): void {
        const openingElement = node.openingElement
        if (openingElement.name.type !== AST_NODE_TYPES.JSXIdentifier || openingElement.name.name !== "Trans") {
          return
        }

        // Trans with id prop is a lazy translation lookup - valid without children
        if (hasIdProp(openingElement)) {
          return
        }

        if (isOnlyVariablesJSX(node.children)) {
          context.report({
            node,
            messageId: "singleVariable"
          })
        }
      }
    }
  }
})
