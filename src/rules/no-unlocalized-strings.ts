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

const DEFAULT_IGNORE_FUNCTIONS = ["console.*", "require", "import", "Error", "TypeError", "RangeError", "SyntaxError"]

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
  "aria-labelledby",
  // SVG attributes
  "viewBox",
  "d",
  "cx",
  "cy",
  "r",
  "x",
  "y",
  "width",
  "height",
  "fill",
  "stroke",
  "transform",
  "points",
  "pathLength"
]

const DEFAULT_IGNORE_NAMES = ["__DEV__", "NODE_ENV"]

/**
 * Checks if a string looks like a user-visible UI string.
 * Supports Latin and Non-Latin scripts (CJK, Cyrillic, Arabic, Hebrew, etc.)
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

  // Looks like a CSS class or technical identifier (ASCII only)
  if (/^[a-z][a-z0-9-_]*$/i.test(trimmed) && !trimmed.includes(" ")) {
    return false
  }

  // Looks like CSS selector or pseudo-class (starts with :, ., #, [, or *)
  if (/^[:.#[*&>+~]/.test(trimmed)) {
    return false
  }

  // Non-Latin scripts: CJK (Chinese, Japanese, Korean), Cyrillic, Arabic, Hebrew, Thai, etc.
  // These are almost always user-visible text
  if (/[\u3000-\u9fff\uac00-\ud7af\u0400-\u04ff\u0600-\u06ff\u0590-\u05ff\u0e00-\u0e7f\u1100-\u11ff]/.test(trimmed)) {
    return true
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
 * Lingui tagged template macros
 */
const LINGUI_TAGGED_TEMPLATES = new Set(["t"])

/**
 * Lingui JSX components
 */
const LINGUI_JSX_COMPONENTS = new Set(["Trans", "Plural", "Select", "SelectOrdinal"])

/**
 * Lingui function macros
 */
const LINGUI_FUNCTION_MACROS = new Set(["msg", "defineMessage", "plural", "select", "selectOrdinal"])

/**
 * Checks if a node is inside a Lingui macro/component.
 */
function isInsideLinguiContext(node: TSESTree.Node): boolean {
  let current: TSESTree.Node | undefined = node.parent ?? undefined

  while (current !== undefined) {
    // Inside t`...`, plural`...`, select`...`, selectOrdinal`...`
    if (
      current.type === AST_NODE_TYPES.TaggedTemplateExpression &&
      current.tag.type === AST_NODE_TYPES.Identifier &&
      LINGUI_TAGGED_TEMPLATES.has(current.tag.name)
    ) {
      return true
    }

    // Inside <Trans>, <Plural>, <Select>, <SelectOrdinal>
    if (
      current.type === AST_NODE_TYPES.JSXElement &&
      current.openingElement.name.type === AST_NODE_TYPES.JSXIdentifier &&
      LINGUI_JSX_COMPONENTS.has(current.openingElement.name.name)
    ) {
      return true
    }

    // Inside msg() or defineMessage()
    if (
      current.type === AST_NODE_TYPES.CallExpression &&
      current.callee.type === AST_NODE_TYPES.Identifier &&
      LINGUI_FUNCTION_MACROS.has(current.callee.name)
    ) {
      return true
    }

    // Inside i18n.t() or i18n._()
    if (
      current.type === AST_NODE_TYPES.CallExpression &&
      current.callee.type === AST_NODE_TYPES.MemberExpression &&
      current.callee.object.type === AST_NODE_TYPES.Identifier &&
      current.callee.object.name === "i18n" &&
      current.callee.property.type === AST_NODE_TYPES.Identifier &&
      (current.callee.property.name === "t" || current.callee.property.name === "_")
    ) {
      return true
    }

    current = current.parent ?? undefined
  }

  return false
}

/**
 * Gets the full callee name from a call expression (e.g., "console.log", "obj.method.call").
 */
function getCalleeName(callee: TSESTree.Expression): string | null {
  if (callee.type === AST_NODE_TYPES.Identifier) {
    return callee.name
  }

  if (callee.type === AST_NODE_TYPES.MemberExpression) {
    const parts: string[] = []
    let current: TSESTree.Expression = callee

    while (current.type === AST_NODE_TYPES.MemberExpression) {
      if (current.property.type === AST_NODE_TYPES.Identifier) {
        parts.unshift(current.property.name)
      } else {
        return null
      }
      current = current.object
    }

    if (current.type === AST_NODE_TYPES.Identifier) {
      parts.unshift(current.name)
      return parts.join(".")
    }
  }

  return null
}

/**
 * Checks if a callee name matches an ignore pattern.
 * Supports wildcards: "console.*", "*.headers.set"
 */
function matchesIgnorePattern(calleeName: string, pattern: string): boolean {
  if (pattern === calleeName) {
    return true
  }

  if (pattern.includes("*")) {
    // Convert pattern to regex: "console.*" -> /^console\.[^.]+$/
    // "*.headers.set" -> /^[^.]+\.headers\.set$/
    const regexPattern = pattern
      .split(".")
      .map((part) => (part === "*" ? "[^.]+" : part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))
      .join("\\.")
    const regex = new RegExp(`^${regexPattern}$`)
    return regex.test(calleeName)
  }

  return false
}

/**
 * Checks if a node is a function argument to an ignored function.
 */
function isIgnoredFunctionArgument(node: TSESTree.Node, ignoreFunctions: string[]): boolean {
  const parent = node.parent

  // Handle CallExpression: fn("string")
  if (parent?.type === AST_NODE_TYPES.CallExpression) {
    const calleeName = getCalleeName(parent.callee)
    if (calleeName !== null) {
      return ignoreFunctions.some((pattern) => matchesIgnorePattern(calleeName, pattern))
    }
  }

  // Handle NewExpression: new Error("string")
  if (parent?.type === AST_NODE_TYPES.NewExpression) {
    const callee = parent.callee
    if (callee.type === AST_NODE_TYPES.Identifier) {
      return ignoreFunctions.some((pattern) => matchesIgnorePattern(callee.name, pattern))
    }
  }

  return false
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
 * Checks if a node is a switch case test.
 */
function isInSwitchCase(node: TSESTree.Node): boolean {
  const parent = node.parent
  return parent?.type === AST_NODE_TYPES.SwitchCase && parent.test === node
}

/**
 * Checks if a node is a computed member expression key (obj["key"]).
 */
function isComputedMemberKey(node: TSESTree.Node): boolean {
  const parent = node.parent
  return parent?.type === AST_NODE_TYPES.MemberExpression && parent.computed && parent.property === node
}

/**
 * Checks if a node is inside a non-Lingui tagged template expression.
 */
function isInNonLinguiTaggedTemplate(node: TSESTree.Node): boolean {
  let current: TSESTree.Node | undefined = node.parent ?? undefined

  while (current !== undefined) {
    if (current.type === AST_NODE_TYPES.TaggedTemplateExpression) {
      // If it's a Lingui tag, it's handled elsewhere
      if (current.tag.type === AST_NODE_TYPES.Identifier && LINGUI_TAGGED_TEMPLATES.has(current.tag.name)) {
        return false
      }
      // Non-Lingui tagged template (styled.div, css, html, etc.)
      return true
    }
    current = current.parent ?? undefined
  }

  return false
}

/**
 * Checks if a node is in an import or export declaration.
 */
function isInImportExport(node: TSESTree.Node): boolean {
  let current: TSESTree.Node | undefined = node.parent ?? undefined

  while (current !== undefined) {
    if (
      current.type === AST_NODE_TYPES.ImportDeclaration ||
      current.type === AST_NODE_TYPES.ExportAllDeclaration ||
      current.type === AST_NODE_TYPES.ExportNamedDeclaration
    ) {
      return true
    }
    current = current.parent ?? undefined
  }

  return false
}

/**
 * Checks if a node is an `as const` assertion.
 */
function isAsConstAssertion(node: TSESTree.Node): boolean {
  const parent = node.parent
  if (parent?.type === AST_NODE_TYPES.TSAsExpression) {
    const typeAnnotation = parent.typeAnnotation
    if (
      typeAnnotation.type === AST_NODE_TYPES.TSTypeReference &&
      typeAnnotation.typeName.type === AST_NODE_TYPES.Identifier &&
      typeAnnotation.typeName.name === "const"
    ) {
      return true
    }
  }
  return false
}

/**
 * Checks if a type is from the Intl namespace or related to localization.
 */
function isIntlRelatedType(typeName: string): boolean {
  return (
    typeName.startsWith("Intl.") ||
    typeName === "LocalesArgument" ||
    typeName === "UnicodeBCP47LocaleIdentifier" ||
    typeName.includes("FormatOptions") ||
    typeName.includes("CollatorOptions")
  )
}

/**
 * Checks if a string literal is a technical string based on TypeScript types.
 * Uses the TypeChecker to detect:
 * - String literal union types (e.g., "left" | "right" | "center")
 * - Intl-related types (e.g., Intl.LocalesArgument, DateTimeFormatOptions)
 * - Discriminated union properties (type/kind fields)
 */
function isTechnicalStringType(
  node: TSESTree.Literal,
  typeChecker: ts.TypeChecker,
  parserServices: ReturnType<typeof ESLintUtils.getParserServices>
): boolean {
  try {
    const tsNode = parserServices.esTreeNodeToTSNodeMap.get(node)
    const contextualType = typeChecker.getContextualType(tsNode)

    if (contextualType !== undefined) {
      // Check if contextual type is a union containing string literals
      // Allow other primitive types: undefined, null, boolean, number
      if (contextualType.isUnion()) {
        const hasStringLiteral = contextualType.types.some((t) => t.isStringLiteral() || (t.flags & 128) !== 0)
        const allTechnical = contextualType.types.every((t) => {
          // String literal (flags: 128)
          if (t.isStringLiteral() || (t.flags & 128) !== 0) {
            return true
          }
          // Number literal (flags: 256)
          if (t.isNumberLiteral() || (t.flags & 256) !== 0) {
            return true
          }
          // Boolean literal - true (flags: 512) or false (flags: 1024)
          if ((t.flags & 512) !== 0 || (t.flags & 1024) !== 0) {
            return true
          }
          // undefined (flags: 32768)
          if ((t.flags & 32768) !== 0) {
            return true
          }
          // null (flags: 65536)
          if ((t.flags & 65536) !== 0) {
            return true
          }
          return false
        })
        // Only ignore if the union contains at least one string literal
        if (hasStringLiteral && allTechnical) {
          return true
        }
      }

      // Check if contextual type is from Intl namespace
      const typeName = typeChecker.typeToString(contextualType)
      if (isIntlRelatedType(typeName)) {
        return true
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
      unlocalizedString: 'String "{{text}}" appears to be user-visible text. Wrap it with t`...` or <Trans>.'
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
    const parserServices = ESLintUtils.getParserServices(context)
    const typeChecker = parserServices.program.getTypeChecker()

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

      // Check if switch case
      if (isInSwitchCase(node)) {
        return
      }

      // Check if computed member key
      if (isComputedMemberKey(node)) {
        return
      }

      // Check if inside non-Lingui tagged template
      if (isInNonLinguiTaggedTemplate(node)) {
        return
      }

      // Check if in import/export
      if (isInImportExport(node)) {
        return
      }

      // Check if as const assertion
      if (isAsConstAssertion(node)) {
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

      // TypeScript type-aware check
      if (isTechnicalStringType(node, typeChecker, parserServices)) {
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
