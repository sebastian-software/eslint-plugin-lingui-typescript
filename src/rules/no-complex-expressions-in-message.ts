import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils"

import { createRule } from "../utils/create-rule.js"

type MessageId = "complexExpression" | "legacyPlaceholder"

export interface Options {
  allowedCallees: string[]
  allowMemberExpressions: boolean
  maxExpressionDepth: number | null
}

/**
 * Default functions that are allowed in Lingui messages.
 *
 * Empty by default! Even i18n.number/date should be extracted to named
 * variables so translators see meaningful placeholder names like {price}
 * instead of anonymous {0}.
 *
 * Bad:  t`Price: ${i18n.number(price)}`  → msgid: "Price: {0}"
 * Good: const formattedPrice = i18n.number(price)
 *       t`Price: ${formattedPrice}`      → msgid: "Price: {formattedPrice}"
 */
const DEFAULT_ALLOWED_CALLEES: string[] = []

/**
 * Lingui helper functions that can be nested inside t`...`.
 * These are used for pluralization and selection based on values.
 *
 * Example: t`You have ${plural(count, { one: '# item', other: '# items' })}`
 */
const LINGUI_HELPERS = new Set(["plural", "select", "selectOrdinal"])

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extracts the function/method name from a call expression.
 *
 * Examples:
 * - `foo()` → "foo"
 * - `obj.method()` → "obj.method"
 * - `a.b.c()` → "a.b.c"
 * - `arr[0]()` → null (computed access not supported)
 */
function getCalleeName(node: TSESTree.Expression): string | null {
  if (node.type === AST_NODE_TYPES.Identifier) {
    return node.name
  }

  // Build the chain for member expressions like obj.method.call
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
 * Counts how deep a member expression chain goes.
 *
 * Examples:
 * - `user.name` → 1
 * - `user.address.city` → 2
 * - `a.b.c.d` → 3
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
 *
 * Allowed by default:
 * - Simple identifiers: `${name}`, `${count}`
 * - Lingui helpers: `${plural(...)}`, `${select(...)}`
 * - Configured callees: `${i18n.number(price)}`
 *
 * Optionally allowed (via options):
 * - Member expressions: `${user.name}` (if allowMemberExpressions: true)
 *
 * Never allowed:
 * - Binary operations: `${a + b}`
 * - Conditionals: `${isX ? 'a' : 'b'}`
 * - Arbitrary function calls: `${formatDate(d)}`
 * - Optional chaining: `${user?.name}`
 */
function isAllowedExpression(node: TSESTree.Expression, options: Options): boolean {
  // Simple identifiers are always allowed: ${name}, ${count}
  if (node.type === AST_NODE_TYPES.Identifier) {
    return true
  }

  // Member expressions: ${user.name}, ${props.value}
  if (node.type === AST_NODE_TYPES.MemberExpression) {
    // Disabled by default - complex paths make translation harder
    if (!options.allowMemberExpressions) {
      return false
    }

    // Check depth limit to prevent deeply nested access like user.profile.settings.theme
    const depth = getMemberExpressionDepth(node)
    if (options.maxExpressionDepth !== null && depth > options.maxExpressionDepth) {
      return false
    }

    // Optional chaining (user?.name) is never allowed - it implies the value
    // might be undefined, which translators can't handle
    if (node.optional) {
      return false
    }

    return true
  }

  // Call expressions: check if it's a Lingui helper or whitelisted function
  if (node.type === AST_NODE_TYPES.CallExpression) {
    const calleeName = getCalleeName(node.callee)
    if (calleeName === null) {
      return false
    }

    // Lingui helpers are always allowed: plural(), select(), selectOrdinal()
    if (LINGUI_HELPERS.has(calleeName)) {
      return true
    }

    // User-configured allowed functions: i18n.number(), i18n.date(), etc.
    if (options.allowedCallees.includes(calleeName)) {
      return true
    }

    return false
  }

  // Everything else (binary ops, conditionals, etc.) is not allowed
  return false
}

/**
 * Returns a human-readable description of an expression type for error messages.
 */
function describeExpression(node: TSESTree.Expression): string {
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
      return "object expression (legacy placeholder syntax?)"
    default:
      return node.type
  }
}

/**
 * Checks if an expression is JSX whitespace like {' '} or {` `}.
 * These are commonly used for spacing in JSX and should be allowed.
 */
function isWhitespaceExpression(expr: TSESTree.Expression): boolean {
  // String literal whitespace: {' '}, {"  "}
  if (expr.type === AST_NODE_TYPES.Literal && typeof expr.value === "string") {
    return expr.value.trim() === ""
  }

  // Template literal whitespace: {` `}, {`  `}
  if (expr.type === AST_NODE_TYPES.TemplateLiteral) {
    const fullText = expr.quasis.map((q) => q.value.raw).join("")
    return fullText.trim() === ""
  }

  return false
}

// ============================================================================
// Rule Definition
// ============================================================================

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
      legacyPlaceholder:
        "Legacy placeholder syntax is not supported. Use simple variables like ${name} instead of object expressions."
    },
    schema: [
      {
        type: "object",
        properties: {
          allowedCallees: {
            type: "array",
            items: { type: "string" },
            default: [],
            description:
              "Function calls to allow (e.g. ['i18n.number', 'i18n.date']). Empty by default - extract to named variables!"
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
    /**
     * Checks a single expression and reports if it's not allowed.
     */
    function checkExpression(expr: TSESTree.Expression): void {
      // Legacy placeholder syntax: ${{name: value}}
      // This was used in older Lingui versions but is no longer recommended
      if (expr.type === AST_NODE_TYPES.ObjectExpression) {
        context.report({
          node: expr,
          messageId: "legacyPlaceholder"
        })
        return
      }

      if (!isAllowedExpression(expr, options)) {
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
        // Only check JSXExpressionContainer nodes: {expr}
        if (child.type !== AST_NODE_TYPES.JSXExpressionContainer) {
          continue
        }

        // Skip empty expressions: {}
        if (child.expression.type === AST_NODE_TYPES.JSXEmptyExpression) {
          continue
        }

        // Allow whitespace expressions: {' '}, {` `}
        // These are commonly used for spacing in JSX
        if (isWhitespaceExpression(child.expression)) {
          continue
        }

        checkExpression(child.expression)
      }
    }

    return {
      /**
       * Handle tagged template literals: t`Hello ${name}`
       */
      TaggedTemplateExpression(node): void {
        // Only check the `t` macro, not other tagged templates like css`...`
        if (node.tag.type !== AST_NODE_TYPES.Identifier || node.tag.name !== "t") {
          return
        }

        checkTemplateExpressions(node.quasi.expressions)
      },

      /**
       * Handle JSX elements: <Trans>Hello {name}</Trans>
       */
      JSXElement(node): void {
        // Only check <Trans> components
        const name = node.openingElement.name
        if (name.type !== AST_NODE_TYPES.JSXIdentifier || name.name !== "Trans") {
          return
        }

        checkJSXExpressionChildren(node.children)
      }
    }
  }
})
