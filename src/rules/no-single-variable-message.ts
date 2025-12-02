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
 * Checks if a JSX element has only a single expression child and no text content.
 */
function isSingleVariableJSX(children: TSESTree.JSXChild[]): boolean {
  const meaningfulChildren = children.filter((child) => {
    if (child.type === AST_NODE_TYPES.JSXText) {
      return child.value.trim() !== ""
    }
    return true
  })

  // Must have exactly one meaningful child that is an expression
  if (meaningfulChildren.length !== 1) {
    return false
  }

  const onlyChild = meaningfulChildren[0]
  return onlyChild?.type === AST_NODE_TYPES.JSXExpressionContainer
}

export const noSingleVariableMessage = createRule<[], MessageId>({
  name: "no-single-variable-message",
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

        if (isSingleVariableJSX(node.children)) {
          context.report({
            node,
            messageId: "singleVariable"
          })
        }
      }
    }
  }
})
