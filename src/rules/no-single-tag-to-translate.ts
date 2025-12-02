import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils"

import { createRule } from "../utils/create-rule.js"

type MessageId = "singleTag"

/**
 * Checks if a JSX element has only a single element child and no text content.
 */
function isSingleTagJSX(children: TSESTree.JSXChild[]): boolean {
  const meaningfulChildren = children.filter((child) => {
    if (child.type === AST_NODE_TYPES.JSXText) {
      return child.value.trim() !== ""
    }
    return true
  })

  if (meaningfulChildren.length !== 1) {
    return false
  }

  const onlyChild = meaningfulChildren[0]
  return onlyChild?.type === AST_NODE_TYPES.JSXElement || onlyChild?.type === AST_NODE_TYPES.JSXFragment
}

export const noSingleTagToTranslate = createRule<[], MessageId>({
  name: "no-single-tag-to-translate",
  meta: {
    type: "problem",
    docs: {
      description: "Disallow Lingui messages that consist only of a single JSX element without surrounding text"
    },
    messages: {
      singleTag: "Translation message should not consist only of a single element. Add surrounding text for context."
    },
    schema: []
  },
  defaultOptions: [],
  create(context) {
    return {
      JSXElement(node): void {
        const openingElement = node.openingElement
        if (openingElement.name.type !== AST_NODE_TYPES.JSXIdentifier || openingElement.name.name !== "Trans") {
          return
        }

        if (isSingleTagJSX(node.children)) {
          context.report({
            node,
            messageId: "singleTag"
          })
        }
      }
    }
  }
})
