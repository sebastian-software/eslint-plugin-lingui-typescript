import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils"

import { createRule } from "../utils/create-rule.js"

type MessageId = "missingPluralKey"

export interface Options {
  requiredKeys: string[]
}

const DEFAULT_REQUIRED_KEYS = ["one", "other"]

/**
 * Extracts attribute names from a JSX opening element.
 */
function getJSXAttributeNames(node: TSESTree.JSXOpeningElement): string[] {
  const names: string[] = []

  for (const attr of node.attributes) {
    if (attr.type === AST_NODE_TYPES.JSXAttribute && attr.name.type === AST_NODE_TYPES.JSXIdentifier) {
      names.push(attr.name.name)
    }
  }

  return names
}

export const consistentPluralFormat = createRule<[Options], MessageId>({
  name: "consistent-plural-format",
  meta: {
    type: "problem",
    docs: {
      description: "Ensure <Plural> component has required plural category props"
    },
    messages: {
      missingPluralKey: "<Plural> is missing required prop '{{key}}'"
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
      JSXElement(node): void {
        const openingElement = node.openingElement

        // Check for <Plural> component
        if (
          openingElement.name.type !== AST_NODE_TYPES.JSXIdentifier ||
          openingElement.name.name !== "Plural"
        ) {
          return
        }

        const providedProps = getJSXAttributeNames(openingElement)

        for (const requiredKey of options.requiredKeys) {
          if (!providedProps.includes(requiredKey)) {
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
