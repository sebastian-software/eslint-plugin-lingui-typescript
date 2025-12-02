import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils"

import { createRule } from "../utils/create-rule.js"

type MessageId = "complexExpression" | "multiplePlaceholders"

export interface Options {
  allowedCallees: string[]
  allowMemberExpressions: boolean
  maxExpressionDepth: number | null
}

const DEFAULT_ALLOWED_CALLEES = ["i18n.number", "i18n.date"]

// Lingui helpers that are always allowed: plural(), select(), selectOrdinal()
const LINGUI_HELPERS = new Set(["plural", "select", "selectOrdinal"])

// Placeholder functions that wrap named placeholders
const PLACEHOLDER_FUNCTIONS = new Set(["ph"])

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
 * Result of checking a placeholder expression.
 */
interface PlaceholderCheckResult {
  allowed: boolean
  multipleKeys?: boolean
}

/**
 * Checks if an object is a valid named placeholder: { name: value }
 * Returns { allowed: true } for single-key objects with simple identifier values.
 * Returns { allowed: false, multipleKeys: true } for multi-key objects.
 */
function checkNamedPlaceholder(node: TSESTree.ObjectExpression): PlaceholderCheckResult {
  const properties = node.properties.filter((p) => p.type === AST_NODE_TYPES.Property)

  // Multiple keys in placeholder is an error
  if (properties.length > 1) {
    return { allowed: false, multipleKeys: true }
  }

  // Single key with identifier value is OK
  const prop = properties[0]
  if (prop !== undefined) {
    // Allow simple identifier values: { name: user }
    if (prop.value.type === AST_NODE_TYPES.Identifier) {
      return { allowed: true }
    }
    // Allow member expressions: { name: obj.prop }
    if (prop.value.type === AST_NODE_TYPES.MemberExpression) {
      return { allowed: true }
    }
  }

  return { allowed: false }
}

/**
 * Checks if a call expression is a placeholder function: ph({ name: value })
 */
function isPlaceholderFunction(node: TSESTree.CallExpression): PlaceholderCheckResult {
  const calleeName = getCalleeName(node.callee)
  if (calleeName === null || !PLACEHOLDER_FUNCTIONS.has(calleeName)) {
    return { allowed: false }
  }

  const [arg] = node.arguments
  if (arg?.type === AST_NODE_TYPES.ObjectExpression) {
    return checkNamedPlaceholder(arg)
  }

  return { allowed: false }
}

/**
 * Checks if an expression is allowed within a Lingui message.
 */
function isAllowedExpression(node: TSESTree.Expression, options: Options): PlaceholderCheckResult {
  // Simple identifiers are always allowed: name, count
  if (node.type === AST_NODE_TYPES.Identifier) {
    return { allowed: true }
  }

  // Member expressions: props.name, user.id
  if (node.type === AST_NODE_TYPES.MemberExpression) {
    if (!options.allowMemberExpressions) {
      return { allowed: false }
    }

    // Check depth limit
    const depth = getMemberExpressionDepth(node)
    if (options.maxExpressionDepth !== null && depth > options.maxExpressionDepth) {
      return { allowed: false }
    }

    // Optional chaining is not allowed
    if (node.optional) {
      return { allowed: false }
    }

    return { allowed: true }
  }

  // Named placeholder syntax: ${{ name: value }}
  if (node.type === AST_NODE_TYPES.ObjectExpression) {
    return checkNamedPlaceholder(node)
  }

  // Call expressions: check if callee is whitelisted or Lingui helper
  if (node.type === AST_NODE_TYPES.CallExpression) {
    const calleeName = getCalleeName(node.callee)

    // Lingui helpers: plural(), select(), selectOrdinal()
    if (calleeName !== null && LINGUI_HELPERS.has(calleeName)) {
      return { allowed: true }
    }

    // User-defined allowed callees
    if (calleeName !== null && options.allowedCallees.includes(calleeName)) {
      return { allowed: true }
    }

    // Placeholder function: ph({ name: value })
    const phResult = isPlaceholderFunction(node)
    if (phResult.allowed || phResult.multipleKeys === true) {
      return phResult
    }

    return { allowed: false }
  }

  // All other expression types are not allowed
  return { allowed: false }
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
        "Complex expression '{{expression}}' in Lingui message. Use simple identifiers or extract to a variable.",
      multiplePlaceholders: "Named placeholder can only have a single key"
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
    function reportExpression(expr: TSESTree.Expression, result: PlaceholderCheckResult): void {
      if (result.multipleKeys === true) {
        context.report({
          node: expr,
          messageId: "multiplePlaceholders"
        })
      } else {
        context.report({
          node: expr,
          messageId: "complexExpression",
          data: {
            expression: getExpressionText(expr)
          }
        })
      }
    }

    function checkExpressions(expressions: TSESTree.Expression[]): void {
      for (const expr of expressions) {
        const result = isAllowedExpression(expr, options)
        if (!result.allowed) {
          reportExpression(expr, result)
        }
      }
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

    function checkJSXChildren(children: TSESTree.JSXChild[]): void {
      for (const child of children) {
        if (
          child.type === AST_NODE_TYPES.JSXExpressionContainer &&
          child.expression.type !== AST_NODE_TYPES.JSXEmptyExpression
        ) {
          // Allow whitespace expressions: {' '}, {` `}
          if (isWhitespaceExpression(child.expression)) {
            continue
          }

          const result = isAllowedExpression(child.expression, options)
          if (!result.allowed) {
            reportExpression(child.expression, result)
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
