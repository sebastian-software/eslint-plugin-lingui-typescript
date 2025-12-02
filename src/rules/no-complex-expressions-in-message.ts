import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils"

import { createRule } from "../utils/create-rule.js"

type MessageId = "complexExpression"

export interface Options {
  allowedCallees: string[]
  allowMemberExpressions: boolean
  maxExpressionDepth: number | null
}

const DEFAULT_ALLOWED_CALLEES = ["i18n.number", "i18n.date"]

/**
 * Gets the string representation of a callee (e.g., "i18n.number", "Math.random").
 */
function getCalleeName(node: TSESTree.Expression): string | null {
  if (node.type === AST_NODE_TYPES.Identifier) {
    return node.name
  }

  if (node.type === AST_NODE_TYPES.MemberExpression && !node.computed) {
    const object = getCalleeName(node.object)
    const property = node.property.type === AST_NODE_TYPES.Identifier ? node.property.name : null

    if (object !== null && property !== null) {
      return `${object}.${property}`
    }
  }

  return null
}

/**
 * Gets the depth of a member expression chain.
 */
function getMemberExpressionDepth(node: TSESTree.MemberExpression): number {
  let depth = 1
  let current: TSESTree.Expression = node.object

  while (current.type === AST_NODE_TYPES.MemberExpression) {
    depth++
    current = current.object
  }

  return depth
}

/**
 * Checks if an expression is allowed within a Lingui message.
 */
function isAllowedExpression(node: TSESTree.Expression, options: Options): boolean {
  // Simple identifiers are always allowed: name, count
  if (node.type === AST_NODE_TYPES.Identifier) {
    return true
  }

  // Member expressions: props.name, user.id
  if (node.type === AST_NODE_TYPES.MemberExpression) {
    if (!options.allowMemberExpressions) {
      return false
    }

    // Check depth limit
    const depth = getMemberExpressionDepth(node)
    if (options.maxExpressionDepth !== null && depth > options.maxExpressionDepth) {
      return false
    }

    // Optional chaining is not allowed
    if (node.optional) {
      return false
    }

    return true
  }

  // Call expressions: check if callee is whitelisted
  if (node.type === AST_NODE_TYPES.CallExpression) {
    const calleeName = getCalleeName(node.callee)
    if (calleeName !== null && options.allowedCallees.includes(calleeName)) {
      return true
    }
    return false
  }

  // All other expression types are not allowed
  return false
}

/**
 * Gets a readable representation of an expression for error messages.
 */
function getExpressionText(node: TSESTree.Expression): string {
  switch (node.type) {
    case AST_NODE_TYPES.BinaryExpression:
      return `binary expression (${node.operator})`
    case AST_NODE_TYPES.CallExpression: {
      const name = getCalleeName(node.callee)
      return name !== null ? `function call (${name})` : "function call"
    }
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

export const noComplexExpressionsInMessage = createRule<[Options], MessageId>({
  name: "no-complex-expressions-in-message",
  meta: {
    type: "problem",
    docs: {
      description: "Disallow complex expressions in Lingui messages"
    },
    messages: {
      complexExpression:
        "Complex expression '{{expression}}' in Lingui message. Use simple identifiers or extract to a variable."
    },
    schema: [
      {
        type: "object",
        properties: {
          allowedCallees: {
            type: "array",
            items: { type: "string" },
            default: DEFAULT_ALLOWED_CALLEES
          },
          allowMemberExpressions: {
            type: "boolean",
            default: false
          },
          maxExpressionDepth: {
            type: ["number", "null"],
            default: 1
          }
        },
        additionalProperties: false
      }
    ]
  },
  defaultOptions: [
    {
      allowedCallees: DEFAULT_ALLOWED_CALLEES,
      allowMemberExpressions: false,
      maxExpressionDepth: 1
    }
  ],
  create(context, [options]) {
    function checkExpressions(expressions: TSESTree.Expression[]): void {
      for (const expr of expressions) {
        if (!isAllowedExpression(expr, options)) {
          context.report({
            node: expr,
            messageId: "complexExpression",
            data: {
              expression: getExpressionText(expr)
            }
          })
        }
      }
    }

    function checkJSXChildren(children: TSESTree.JSXChild[]): void {
      for (const child of children) {
        if (
          child.type === AST_NODE_TYPES.JSXExpressionContainer &&
          child.expression.type !== AST_NODE_TYPES.JSXEmptyExpression
        ) {
          if (!isAllowedExpression(child.expression, options)) {
            context.report({
              node: child.expression,
              messageId: "complexExpression",
              data: {
                expression: getExpressionText(child.expression)
              }
            })
          }
        }
      }
    }

    return {
      // Check t`Hello ${expr}` pattern
      TaggedTemplateExpression(node): void {
        if (node.tag.type !== AST_NODE_TYPES.Identifier || node.tag.name !== "t") {
          return
        }

        checkExpressions(node.quasi.expressions)
      },

      // Check <Trans>Hello {expr}</Trans> pattern
      JSXElement(node): void {
        const openingElement = node.openingElement
        if (openingElement.name.type !== AST_NODE_TYPES.JSXIdentifier || openingElement.name.name !== "Trans") {
          return
        }

        checkJSXChildren(node.children)
      }
    }
  }
})
