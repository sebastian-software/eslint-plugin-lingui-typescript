import { AST_NODE_TYPES, ESLintUtils, type TSESTree } from "@typescript-eslint/utils"
import type ts from "typescript"

import { createRule } from "../utils/create-rule.js"

type MessageId = "unlocalizedString"

export interface Options {
  ignoreFunctions: string[]
  ignoreProperties: string[]
  ignoreNames: string[]
  ignorePattern: string | null
}

const DEFAULT_IGNORE_FUNCTIONS = [
  "console.log",
  "console.warn",
  "console.error",
  "console.info",
  "console.debug",
  "require",
  "import"
]

const DEFAULT_IGNORE_PROPERTIES = [
  "className",
  "styleName",
  "style",
  "type",
  "id",
  "key",
  "name",
  "testID",
  "data-testid",
  "href",
  "src",
  "role",
  "aria-label",
  "aria-describedby",
  "aria-labelledby"
]

const DEFAULT_IGNORE_NAMES = ["__DEV__", "NODE_ENV"]

/**
 * Checks if a string looks like a user-visible UI string.
 */
function looksLikeUIString(value: string): boolean {
  const trimmed = value.trim()

  // Empty or whitespace only
  if (trimmed.length === 0) {
    return false
  }

  // Single character (likely technical)
  if (trimmed.length === 1) {
    return false
  }

  // All uppercase with underscores (likely constant)
  if (/^[A-Z][A-Z0-9_]*$/.test(trimmed)) {
    return false
  }

  // Looks like a path or URL
  if (/^(\/|https?:|mailto:|tel:|#)/.test(trimmed)) {
    return false
  }

  // Looks like a CSS class or technical identifier
  if (/^[a-z][a-z0-9-_]*$/i.test(trimmed) && !trimmed.includes(" ")) {
    return false
  }

  // Contains letters and spaces (likely UI text)
  if (/[a-zA-Z]/.test(trimmed) && /\s/.test(trimmed)) {
    return true
  }

  // Starts with uppercase letter followed by lowercase (likely sentence)
  if (/^[A-Z][a-z]/.test(trimmed)) {
    return true
  }

  // Contains common UI patterns
  if (/[.!?:,]/.test(trimmed)) {
    return true
  }

  return false
}

/**
 * Checks if a node is inside a Lingui macro/component.
 */
function isInsideLinguiContext(node: TSESTree.Node): boolean {
  let current: TSESTree.Node | undefined = node.parent ?? undefined

  while (current !== undefined) {
    // Inside t`...`
    if (
      current.type === AST_NODE_TYPES.TaggedTemplateExpression &&
      current.tag.type === AST_NODE_TYPES.Identifier &&
      current.tag.name === "t"
    ) {
      return true
    }

    // Inside <Trans>
    if (
      current.type === AST_NODE_TYPES.JSXElement &&
      current.openingElement.name.type === AST_NODE_TYPES.JSXIdentifier &&
      current.openingElement.name.name === "Trans"
    ) {
      return true
    }

    // Inside msg() or defineMessage()
    if (
      current.type === AST_NODE_TYPES.CallExpression &&
      current.callee.type === AST_NODE_TYPES.Identifier &&
      (current.callee.name === "msg" || current.callee.name === "defineMessage")
    ) {
      return true
    }

    current = current.parent ?? undefined
  }

  return false
}

/**
 * Checks if a node is a function argument to an ignored function.
 */
function isIgnoredFunctionArgument(node: TSESTree.Node, ignoreFunctions: string[]): boolean {
  const parent = node.parent
  if (parent?.type !== AST_NODE_TYPES.CallExpression) {
    return false
  }

  const callee = parent.callee
  let calleeName: string | null = null

  if (callee.type === AST_NODE_TYPES.Identifier) {
    calleeName = callee.name
  } else if (callee.type === AST_NODE_TYPES.MemberExpression) {
    if (
      callee.object.type === AST_NODE_TYPES.Identifier &&
      callee.property.type === AST_NODE_TYPES.Identifier
    ) {
      calleeName = `${callee.object.name}.${callee.property.name}`
    }
  }

  return calleeName !== null && ignoreFunctions.includes(calleeName)
}

/**
 * Checks if a node is a value for an ignored property/attribute.
 */
function isIgnoredProperty(node: TSESTree.Node, ignoreProperties: string[]): boolean {
  const parent = node.parent

  // JSX attribute: <div prop="value" />
  if (parent?.type === AST_NODE_TYPES.JSXAttribute) {
    if (parent.name.type === AST_NODE_TYPES.JSXIdentifier) {
      return ignoreProperties.includes(parent.name.name)
    }
  }

  // Object property: { prop: "value" }
  if (parent?.type === AST_NODE_TYPES.Property) {
    if (parent.key.type === AST_NODE_TYPES.Identifier) {
      return ignoreProperties.includes(parent.key.name)
    }
    if (parent.key.type === AST_NODE_TYPES.Literal && typeof parent.key.value === "string") {
      return ignoreProperties.includes(parent.key.value)
    }
  }

  return false
}

/**
 * Checks if a node is in a type context (type alias, interface, etc.).
 */
function isInTypeContext(node: TSESTree.Node): boolean {
  let current: TSESTree.Node | undefined = node.parent ?? undefined

  while (current !== undefined) {
    if (
      current.type === AST_NODE_TYPES.TSTypeAliasDeclaration ||
      current.type === AST_NODE_TYPES.TSInterfaceDeclaration ||
      current.type === AST_NODE_TYPES.TSTypeAnnotation ||
      current.type === AST_NODE_TYPES.TSAsExpression ||
      current.type === AST_NODE_TYPES.TSTypeAssertion
    ) {
      return true
    }
    current = current.parent ?? undefined
  }

  return false
}

/**
 * Checks if a string literal is a technical string based on TypeScript types.
 */
function isTechnicalStringType(
  node: TSESTree.Literal,
  typeChecker: ts.TypeChecker,
  parserServices: ReturnType<typeof ESLintUtils.getParserServices>
): boolean {
  try {
    const tsNode = parserServices.esTreeNodeToTSNodeMap.get(node)
    const type = typeChecker.getTypeAtLocation(tsNode)

    // Check if the type is a string literal type
    if (type.isStringLiteral()) {
      // Check if there's a contextual type that's a union of literals
      const contextualType = typeChecker.getContextualType(tsNode)
      if (contextualType?.isUnion() === true) {
        const allStringLiterals = contextualType.types.every(
          (t) => t.isStringLiteral() || (t.flags & 128) !== 0 // StringLiteral flag
        )
        if (allStringLiterals) {
          return true
        }
      }
    }

    // Check if it's used as a discriminator (type/kind property)
    const parent = node.parent
    if (parent.type === AST_NODE_TYPES.Property) {
      const key = parent.key
      if (key.type === AST_NODE_TYPES.Identifier && (key.name === "type" || key.name === "kind")) {
        return true
      }
    }
  } catch {
    // If type checking fails, fall back to false
    return false
  }

  return false
}

export const noUnlocalizedStrings = createRule<[Options], MessageId>({
  name: "no-unlocalized-strings",
  meta: {
    type: "suggestion",
    docs: {
      description: "Detect user-visible strings not wrapped in Lingui translation macros"
    },
    messages: {
      unlocalizedString:
        'String "{{text}}" appears to be user-visible text. Wrap it with t`...` or <Trans>.'
    },
    schema: [
      {
        type: "object",
        properties: {
          ignoreFunctions: {
            type: "array",
            items: { type: "string" },
            default: DEFAULT_IGNORE_FUNCTIONS
          },
          ignoreProperties: {
            type: "array",
            items: { type: "string" },
            default: DEFAULT_IGNORE_PROPERTIES
          },
          ignoreNames: {
            type: "array",
            items: { type: "string" },
            default: DEFAULT_IGNORE_NAMES
          },
          ignorePattern: {
            type: ["string", "null"],
            default: null
          }
        },
        additionalProperties: false
      }
    ]
  },
  defaultOptions: [
    {
      ignoreFunctions: DEFAULT_IGNORE_FUNCTIONS,
      ignoreProperties: DEFAULT_IGNORE_PROPERTIES,
      ignoreNames: DEFAULT_IGNORE_NAMES,
      ignorePattern: null
    }
  ],
  create(context, [options]) {
    // Try to get type information (may not be available)
    const parserServices = ESLintUtils.getParserServices(context, true)
    const typeChecker =
      parserServices.program != null ? parserServices.program.getTypeChecker() : null

    const ignoreRegex = options.ignorePattern !== null ? new RegExp(options.ignorePattern) : null

    function checkStringLiteral(node: TSESTree.Literal): void {
      if (typeof node.value !== "string") {
        return
      }

      const value = node.value

      // Check ignore pattern
      if (ignoreRegex?.test(value) === true) {
        return
      }

      // Check if it looks like UI text
      if (!looksLikeUIString(value)) {
        return
      }

      // Check if inside Lingui context
      if (isInsideLinguiContext(node)) {
        return
      }

      // Check if in type context
      if (isInTypeContext(node)) {
        return
      }

      // Check ignored functions
      if (isIgnoredFunctionArgument(node, options.ignoreFunctions)) {
        return
      }

      // Check ignored properties
      if (isIgnoredProperty(node, options.ignoreProperties)) {
        return
      }

      // TypeScript-aware check
      if (typeChecker !== null && isTechnicalStringType(node, typeChecker, parserServices)) {
        return
      }

      context.report({
        node,
        messageId: "unlocalizedString",
        data: {
          text: value.length > 30 ? `${value.substring(0, 30)}...` : value
        }
      })
    }

    function checkJSXText(node: TSESTree.JSXText): void {
      const value = node.value.trim()

      if (value.length === 0) {
        return
      }

      // Check ignore pattern
      if (ignoreRegex?.test(value) === true) {
        return
      }

      // Check if it looks like UI text
      if (!looksLikeUIString(value)) {
        return
      }

      // Check if inside Lingui context
      if (isInsideLinguiContext(node)) {
        return
      }

      context.report({
        node,
        messageId: "unlocalizedString",
        data: {
          text: value.length > 30 ? `${value.substring(0, 30)}...` : value
        }
      })
    }

    return {
      Literal: checkStringLiteral,
      JSXText: checkJSXText
    }
  }
})

