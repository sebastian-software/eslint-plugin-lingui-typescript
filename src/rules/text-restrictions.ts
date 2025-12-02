import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils"

import { createRule } from "../utils/create-rule.js"

type MessageId = "forbiddenPattern" | "tooShort"

interface Options {
  forbiddenPatterns: string[]
  minLength: number | null
}

/**
 * Extracts text content from a template literal (excluding expressions).
 */
function getTemplateText(node: TSESTree.TemplateLiteral): string {
  return node.quasis.map((quasi) => quasi.value.raw).join("")
}

/**
 * Extracts text content from JSX children (excluding expressions).
 */
function getJSXText(children: TSESTree.JSXChild[]): string {
  return children
    .filter((child): child is TSESTree.JSXText => child.type === AST_NODE_TYPES.JSXText)
    .map((child) => child.value)
    .join("")
}

export const textRestrictions = createRule<[Options], MessageId>({
  name: "text-restrictions",
  meta: {
    type: "problem",
    docs: {
      description: "Enforce project-specific restrictions on Lingui message text content"
    },
    messages: {
      forbiddenPattern: "Message contains forbidden pattern: {{pattern}}",
      tooShort: "Message is too short ({{length}} chars). Minimum required: {{minLength}}"
    },
    schema: [
      {
        type: "object",
        properties: {
          forbiddenPatterns: {
            type: "array",
            items: { type: "string" },
            default: []
          },
          minLength: {
            type: ["number", "null"],
            default: null
          }
        },
        additionalProperties: false
      }
    ]
  },
  defaultOptions: [
    {
      forbiddenPatterns: [],
      minLength: null
    }
  ],
  create(context, [options]) {
    const forbiddenRegexes = options.forbiddenPatterns.map((pattern) => ({
      pattern,
      regex: new RegExp(pattern)
    }))

    function checkText(text: string, node: TSESTree.Node): void {
      // Check forbidden patterns
      for (const { pattern, regex } of forbiddenRegexes) {
        if (regex.test(text)) {
          context.report({
            node,
            messageId: "forbiddenPattern",
            data: { pattern }
          })
        }
      }

      // Check minimum length
      const trimmedLength = text.trim().length
      if (options.minLength !== null && trimmedLength > 0 && trimmedLength < options.minLength) {
        context.report({
          node,
          messageId: "tooShort",
          data: {
            length: String(trimmedLength),
            minLength: String(options.minLength)
          }
        })
      }
    }

    return {
      // Check t`...` pattern
      TaggedTemplateExpression(node): void {
        if (node.tag.type !== AST_NODE_TYPES.Identifier || node.tag.name !== "t") {
          return
        }

        const text = getTemplateText(node.quasi)
        checkText(text, node)
      },

      // Check <Trans>...</Trans> pattern
      JSXElement(node): void {
        const openingElement = node.openingElement
        if (
          openingElement.name.type !== AST_NODE_TYPES.JSXIdentifier ||
          openingElement.name.name !== "Trans"
        ) {
          return
        }

        const text = getJSXText(node.children)
        checkText(text, node)
      }
    }
  }
})

