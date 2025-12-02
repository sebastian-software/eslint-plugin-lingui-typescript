import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils"

import { createRule } from "../utils/create-rule.js"

type MessageId = "missingPluralKey"

interface Options {
  requiredKeys: string[]
}

const DEFAULT_REQUIRED_KEYS = ["one", "other"]

/**
 * Extracts property keys from an object expression.
 */
function getObjectKeys(node: TSESTree.ObjectExpression): string[] {
  const keys: string[] = []

  for (const property of node.properties) {
    if (property.type === AST_NODE_TYPES.Property) {
      if (property.key.type === AST_NODE_TYPES.Identifier) {
        keys.push(property.key.name)
      } else if (property.key.type === AST_NODE_TYPES.Literal && typeof property.key.value === "string") {
        keys.push(property.key.value)
      }
    }
  }

  return keys
}

/**
 * Checks if a call expression is a plural helper call.
 */
function isPluralCall(node: TSESTree.CallExpression): boolean {
  // Check for: plural(...)
  if (node.callee.type === AST_NODE_TYPES.Identifier && node.callee.name === "plural") {
    return true
  }

  // Check for: i18n.plural(...)
  if (
    node.callee.type === AST_NODE_TYPES.MemberExpression &&
    node.callee.property.type === AST_NODE_TYPES.Identifier &&
    node.callee.property.name === "plural"
  ) {
    return true
  }

  return false
}

/**
 * Gets the options object from a plural call.
 * plural(count, { one: '...', other: '...' })
 */
function getPluralOptionsObject(node: TSESTree.CallExpression): TSESTree.ObjectExpression | null {
  // Expected format: plural(value, { ... }) or plural({ value, ... })
  for (const arg of node.arguments) {
    if (arg.type === AST_NODE_TYPES.ObjectExpression) {
      return arg
    }
  }
  return null
}

export const consistentPluralFormat = createRule<[Options], MessageId>({
  name: "consistent-plural-format",
  meta: {
    type: "problem",
    docs: {
      description: "Ensure consistent plural usage with required keys"
    },
    messages: {
      missingPluralKey: "Plural is missing required key '{{key}}'"
    },
    schema: [
      {
        type: "object",
        properties: {
          requiredKeys: {
            type: "array",
            items: { type: "string" },
            default: DEFAULT_REQUIRED_KEYS
          }
        },
        additionalProperties: false
      }
    ]
  },
  defaultOptions: [
    {
      requiredKeys: DEFAULT_REQUIRED_KEYS
    }
  ],
  create(context, [options]) {
    return {
      CallExpression(node): void {
        if (!isPluralCall(node)) {
          return
        }

        const optionsObject = getPluralOptionsObject(node)
        if (optionsObject === null) {
          return
        }

        const providedKeys = getObjectKeys(optionsObject)

        for (const requiredKey of options.requiredKeys) {
          if (!providedKeys.includes(requiredKey)) {
            context.report({
              node,
              messageId: "missingPluralKey",
              data: { key: requiredKey }
            })
          }
        }
      }
    }
  }
})

