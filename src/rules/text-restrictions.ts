import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils"

import { createRule } from "../utils/create-rule.js"

type MessageId = "forbiddenPattern" | "tooShort"

interface RestrictionRule {
  patterns: string[]
  message: string
  flags?: string
}

export interface Options {
  rules: RestrictionRule[]
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
      forbiddenPattern: "{{message}}",
      tooShort: "Message is too short ({{length}} chars). Minimum required: {{minLength}}"
    },
    schema: [
      {
        type: "object",
        properties: {
          rules: {
            type: "array",
            items: {
              type: "object",
              properties: {
                patterns: {
                  type: "array",
                  items: { type: "string" }
                },
                message: { type: "string" },
                flags: { type: "string" }
              },
              required: ["patterns", "message"],
              additionalProperties: false
            },
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
      rules: [],
      minLength: null
    }
  ],
  create(context, [options]) {
    // Pre-compile all regex patterns
    const compiledRules = options.rules.map((rule) => ({
      message: rule.message,
      regexes: rule.patterns.map((pattern) => new RegExp(pattern, rule.flags))
    }))

    function checkText(text: string, node: TSESTree.Node): void {
      // Check forbidden patterns
      for (const rule of compiledRules) {
        for (const regex of rule.regexes) {
          if (regex.test(text)) {
            context.report({
              node,
              messageId: "forbiddenPattern",
              data: { message: rule.message }
            })
          }
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
        if (openingElement.name.type !== AST_NODE_TYPES.JSXIdentifier || openingElement.name.name !== "Trans") {
          return
        }

        const text = getJSXText(node.children)
        checkText(text, node)
      }
    }
  }
})
