import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils"

import { createRule } from "../utils/create-rule.js"

type MessageId = "topLevelNotAllowed"

/**
 * Checks if a node is inside a valid context for t calls.
 * Valid contexts:
 * - Function declarations/expressions/arrows
 * - Static class properties (evaluated at class definition time)
 * - Class methods (via FunctionExpression)
 */
function isInsideValidContext(node: TSESTree.Node): boolean {
  let current: TSESTree.Node | undefined = node.parent ?? undefined

  while (current !== undefined) {
    switch (current.type) {
      case AST_NODE_TYPES.FunctionDeclaration:
      case AST_NODE_TYPES.FunctionExpression:
      case AST_NODE_TYPES.ArrowFunctionExpression:
        return true
      // Static/instance class properties are valid - evaluated at class time, not module load
      case AST_NODE_TYPES.PropertyDefinition:
        return true
      default:
        break
    }
    current = current.parent ?? undefined
  }

  return false
}

export const tCallInFunction = createRule<[], MessageId>({
  name: "t-call-in-function",
  meta: {
    type: "problem",
    docs: {
      description: "Enforce that t macro calls are inside functions, not at module top-level"
    },
    messages: {
      topLevelNotAllowed: "t`...` must not be used at module top-level. Move it inside a function, component, or hook."
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

        if (!isInsideValidContext(node)) {
          context.report({
            node,
            messageId: "topLevelNotAllowed"
          })
        }
      }
    }
  }
})
