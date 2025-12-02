import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils"

import { createRule } from "../utils/create-rule.js"

type MessageId = "topLevelNotAllowed"

export interface Options {
  allowTopLevel: boolean
}

/**
 * Checks if a node is inside a function, arrow function, or method.
 */
function isInsideFunction(node: TSESTree.Node): boolean {
  let current: TSESTree.Node | undefined = node.parent ?? undefined

  while (current !== undefined) {
    switch (current.type) {
      case AST_NODE_TYPES.FunctionDeclaration:
      case AST_NODE_TYPES.FunctionExpression:
      case AST_NODE_TYPES.ArrowFunctionExpression:
      case AST_NODE_TYPES.MethodDefinition:
        return true
      default:
        break
    }
    current = current.parent ?? undefined
  }

  return false
}

export const validTCallLocation = createRule<[Options], MessageId>({
  name: "valid-t-call-location",
  meta: {
    type: "problem",
    docs: {
      description: "Enforce that t macro calls are inside functions, not at module top-level"
    },
    messages: {
      topLevelNotAllowed: "t`...` should not be used at module top-level. Move it inside a function or component."
    },
    schema: [
      {
        type: "object",
        properties: {
          allowTopLevel: {
            type: "boolean",
            default: false
          }
        },
        additionalProperties: false
      }
    ]
  },
  defaultOptions: [
    {
      allowTopLevel: false
    }
  ],
  create(context, [options]) {
    if (options.allowTopLevel) {
      return {}
    }

    return {
      TaggedTemplateExpression(node): void {
        if (node.tag.type !== AST_NODE_TYPES.Identifier || node.tag.name !== "t") {
          return
        }

        if (!isInsideFunction(node)) {
          context.report({
            node,
            messageId: "topLevelNotAllowed"
          })
        }
      }
    }
  }
})
