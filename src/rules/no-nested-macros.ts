import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils"

import { createRule } from "../utils/create-rule.js"

type MessageId = "nestedMacro"

export interface Options {
  macros: string[]
  allowDifferentMacros: boolean
}

const DEFAULT_MACROS = ["t", "Trans", "msg", "defineMessage"]

/**
 * Gets the name of a macro from various node types.
 */
function getMacroName(node: TSESTree.Node): string | null {
  // Tagged template: t`...`
  if (node.type === AST_NODE_TYPES.TaggedTemplateExpression) {
    if (node.tag.type === AST_NODE_TYPES.Identifier) {
      return node.tag.name
    }
  }

  // JSX element: <Trans>...</Trans>
  if (node.type === AST_NODE_TYPES.JSXElement) {
    const name = node.openingElement.name
    if (name.type === AST_NODE_TYPES.JSXIdentifier) {
      return name.name
    }
  }

  // Call expression: msg({...}), defineMessage({...})
  if (node.type === AST_NODE_TYPES.CallExpression) {
    if (node.callee.type === AST_NODE_TYPES.Identifier) {
      return node.callee.name
    }
  }

  return null
}

/**
 * Finds the nearest ancestor that is a Lingui macro.
 */
function findParentMacro(node: TSESTree.Node, macros: string[]): { node: TSESTree.Node; name: string } | null {
  let current = node.parent

  while (current) {
    const name = getMacroName(current)
    if (name !== null && macros.includes(name)) {
      return { node: current, name }
    }
    current = current.parent
  }

  return null
}

export const noNestedMacros = createRule<[Options], MessageId>({
  name: "no-nested-macros",
  meta: {
    type: "problem",
    docs: {
      description: "Disallow nesting of Lingui macros inside other Lingui macros"
    },
    messages: {
      nestedMacro: "Nested Lingui macro '{{macro}}' is not allowed inside '{{parent}}'"
    },
    schema: [
      {
        type: "object",
        properties: {
          macros: {
            type: "array",
            items: { type: "string" },
            default: DEFAULT_MACROS
          },
          allowDifferentMacros: {
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
      macros: DEFAULT_MACROS,
      allowDifferentMacros: false
    }
  ],
  create(context, [options]) {
    const macros = options.macros
    const allowDifferentMacros = options.allowDifferentMacros

    function checkNode(node: TSESTree.Node): void {
      const macroName = getMacroName(node)
      if (macroName === null || !macros.includes(macroName)) {
        return
      }

      const parentMacro = findParentMacro(node, macros)
      if (parentMacro === null) {
        return
      }

      // If allowDifferentMacros is true, only report if same macro type
      if (allowDifferentMacros && parentMacro.name !== macroName) {
        return
      }

      context.report({
        node,
        messageId: "nestedMacro",
        data: {
          macro: macroName,
          parent: parentMacro.name
        }
      })
    }

    return {
      TaggedTemplateExpression: checkNode,
      JSXElement: checkNode,
      CallExpression: checkNode
    }
  }
})
