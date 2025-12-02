import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils"

import { createRule } from "../utils/create-rule.js"

type MessageId = "hashRequired" | "templateRequired"

type Style = "hash" | "template"

export interface Options {
  style: Style
}

const PLURAL_KEYWORDS = ["zero", "one", "two", "few", "many", "other"]

/**
 * Gets the value and count variable from a plural() call or <Plural> component.
 */
function getPluralInfo(node: TSESTree.CallExpression | TSESTree.JSXElement):
  | {
      valueVar: string | null
      options: { key: string; value: TSESTree.Node; stringValue: string | null }[]
    }
  | undefined {
  if (node.type === AST_NODE_TYPES.CallExpression) {
    // plural(count, { one: "# item", other: "# items" })
    if (node.callee.type !== AST_NODE_TYPES.Identifier || node.callee.name !== "plural") {
      return undefined
    }

    const [countArg, optionsArg] = node.arguments
    if (optionsArg?.type !== AST_NODE_TYPES.ObjectExpression) {
      return undefined
    }

    const valueVar = countArg?.type === AST_NODE_TYPES.Identifier ? countArg.name : null

    const options: { key: string; value: TSESTree.Node; stringValue: string | null }[] = []

    for (const prop of optionsArg.properties) {
      if (prop.type !== AST_NODE_TYPES.Property) {
        continue
      }

      let keyName: string | null = null
      if (prop.key.type === AST_NODE_TYPES.Identifier) {
        keyName = prop.key.name
      } else if (prop.key.type === AST_NODE_TYPES.Literal && typeof prop.key.value === "string") {
        keyName = prop.key.value
      }

      if (keyName === null || !PLURAL_KEYWORDS.includes(keyName)) {
        continue
      }

      let stringValue: string | null = null
      if (prop.value.type === AST_NODE_TYPES.Literal && typeof prop.value.value === "string") {
        stringValue = prop.value.value
      } else if (prop.value.type === AST_NODE_TYPES.TemplateLiteral && prop.value.quasis.length > 0) {
        // Combine all quasi values
        stringValue = prop.value.quasis.map((q) => q.value.raw).join("")
      }

      options.push({ key: keyName, value: prop.value, stringValue })
    }

    return { valueVar, options }
  }

  // <Plural value={count} one="# item" other="# items" />
  // At this point, node must be JSXElement since we already handled CallExpression
  const openingElement = node.openingElement
  if (openingElement.name.type !== AST_NODE_TYPES.JSXIdentifier || openingElement.name.name !== "Plural") {
    return undefined
  }

  let valueVar: string | null = null
  const options: { key: string; value: TSESTree.Node; stringValue: string | null }[] = []

  for (const attr of openingElement.attributes) {
    if (attr.type !== AST_NODE_TYPES.JSXAttribute || attr.name.type !== AST_NODE_TYPES.JSXIdentifier) {
      continue
    }

    const attrName = attr.name.name

    if (attrName === "value" && attr.value?.type === AST_NODE_TYPES.JSXExpressionContainer) {
      if (attr.value.expression.type === AST_NODE_TYPES.Identifier) {
        valueVar = attr.value.expression.name
      }
      continue
    }

    if (!PLURAL_KEYWORDS.includes(attrName)) {
      continue
    }

    let stringValue: string | null = null
    let valueNode: TSESTree.Node = attr.value ?? attr

    if (attr.value?.type === AST_NODE_TYPES.Literal && typeof attr.value.value === "string") {
      stringValue = attr.value.value
    } else if (attr.value?.type === AST_NODE_TYPES.JSXExpressionContainer) {
      const expr = attr.value.expression
      valueNode = expr // Use the actual expression for template checking
      if (expr.type === AST_NODE_TYPES.TemplateLiteral && expr.quasis.length > 0) {
        stringValue = expr.quasis.map((q) => q.value.raw).join("")
      }
    }

    options.push({ key: attrName, value: valueNode, stringValue })
  }

  return { valueVar, options }
}

/**
 * Checks if a string uses hash (#) format.
 */
function usesHashFormat(str: string): boolean {
  return str.includes("#")
}

/**
 * Checks if a template literal uses the variable (template format).
 */
function usesTemplateFormat(node: TSESTree.Node, varName: string | null): boolean {
  if (node.type !== AST_NODE_TYPES.TemplateLiteral || varName === null) {
    return false
  }

  for (const expr of node.expressions) {
    if (expr.type === AST_NODE_TYPES.Identifier && expr.name === varName) {
      return true
    }
  }

  return false
}

export const consistentPluralFormat = createRule<[Options], MessageId>({
  name: "consistent-plural-format",
  meta: {
    type: "problem",
    docs: {
      description: "Enforce consistent plural format style (# hash or ${var} template)"
    },
    messages: {
      hashRequired: 'Use # format instead of template literal for "{{key}}" value',
      templateRequired: 'Use template format ${var} instead of # for "{{key}}" value'
    },
    schema: [
      {
        type: "object",
        properties: {
          style: {
            type: "string",
            enum: ["hash", "template"],
            default: "hash"
          }
        },
        additionalProperties: false
      }
    ]
  },
  defaultOptions: [
    {
      style: "hash"
    }
  ],
  create(context, [options]) {
    function checkPluralNode(node: TSESTree.CallExpression | TSESTree.JSXElement): void {
      const info = getPluralInfo(node)
      if (info === undefined) {
        return
      }

      const { valueVar, options: pluralOptions } = info

      for (const opt of pluralOptions) {
        const hasHash = opt.stringValue !== null && usesHashFormat(opt.stringValue)
        const hasTemplate = usesTemplateFormat(opt.value, valueVar)

        if (options.style === "hash") {
          // Hash required: error if using template format
          if (hasTemplate && !hasHash) {
            context.report({
              node: opt.value,
              messageId: "hashRequired",
              data: { key: opt.key }
            })
          }
        } else {
          // Template required: error if using hash format
          if (hasHash && !hasTemplate) {
            context.report({
              node: opt.value,
              messageId: "templateRequired",
              data: { key: opt.key }
            })
          }
        }
      }
    }

    return {
      CallExpression(node): void {
        checkPluralNode(node)
      },
      JSXElement(node): void {
        checkPluralNode(node)
      }
    }
  }
})
