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

// ============================================================================
// Default Configuration
// ============================================================================

/**
 * Functions whose arguments should not be checked for localization.
 * Supports wildcards: "console.*" matches console.log, console.error, etc.
 *
 * This list is intentionally minimal - Error constructors and console methods
 * are detected automatically via TypeScript types.
 */
const DEFAULT_IGNORE_FUNCTIONS = ["require", "import"]

/**
 * JSX attributes and object properties whose values should not be checked.
 *
 * This list is intentionally minimal - most HTML/SVG attributes are detected
 * automatically via TypeScript types (string literal unions like "button" | "submit").
 *
 * We only list properties that:
 * 1. Accept arbitrary strings (not literal unions) but are still technical
 * 2. Are framework-specific and not in standard type definitions
 */
const DEFAULT_IGNORE_PROPERTIES = [
  // CSS class names - accept arbitrary strings, always technical
  "className",
  // React key prop
  "key",
  // Testing ID - DOM Testing Library standard
  "data-testid"
]

/**
 * Variable names whose values should not be checked.
 */
const DEFAULT_IGNORE_NAMES = ["__DEV__", "NODE_ENV"]

// ============================================================================
// Lingui Context Detection
// ============================================================================

/** Known Lingui package prefixes */
const LINGUI_PACKAGES = ["@lingui/macro", "@lingui/react", "@lingui/core"]

/** Tagged template macros from Lingui */
const LINGUI_TAGGED_TEMPLATES = new Set(["t"])

/** JSX components from Lingui that handle localization */
const LINGUI_JSX_COMPONENTS = new Set(["Trans", "Plural", "Select", "SelectOrdinal"])

/** Function-style macros from Lingui */
const LINGUI_FUNCTION_MACROS = new Set(["msg", "defineMessage", "plural", "select", "selectOrdinal"])

/**
 * Checks if a symbol originates from a Lingui package using TypeScript's type system.
 *
 * This is more reliable than just checking the name because:
 * - It works with re-exports
 * - It doesn't match unrelated functions with the same name
 * - It handles aliased imports
 *
 * Returns:
 * - true: Definitely from Lingui
 * - false: Definitely NOT from Lingui (different module) or unknown
 * - null: No type info available (use name-based fallback)
 */
function isLinguiSymbol(
  node: TSESTree.Node,
  typeChecker: ts.TypeChecker,
  parserServices: ReturnType<typeof ESLintUtils.getParserServices>
): boolean | null {
  try {
    const tsNode = parserServices.esTreeNodeToTSNodeMap.get(node)
    const symbol = typeChecker.getSymbolAtLocation(tsNode)

    if (symbol === undefined) {
      // No symbol info - use name-based fallback
      return null
    }

    // Follow aliases to get the original declaration
    const resolvedSymbol = symbol.flags & 2097152 ? typeChecker.getAliasedSymbol(symbol) : symbol

    const declarations = resolvedSymbol.getDeclarations()
    if (declarations === undefined || declarations.length === 0) {
      // No declarations - use name-based fallback
      return null
    }

    // Check if any declaration comes from a Lingui package
    for (const decl of declarations) {
      const sourceFile = decl.getSourceFile()
      const fileName = sourceFile.fileName

      if (LINGUI_PACKAGES.some((pkg) => fileName.includes(`node_modules/${pkg}/`))) {
        return true
      }
    }

    // Has declarations but none from Lingui - this is NOT a Lingui symbol
    // However, if declarations are only from the current file (no module info),
    // we should fallback to name matching
    const hasExternalDeclaration = declarations.some((decl) => {
      const fileName = decl.getSourceFile().fileName
      return fileName.includes("node_modules/")
    })

    if (hasExternalDeclaration) {
      // Definitely from a different package
      return false
    }

    // Local declaration or ambient - use name-based fallback
    return null
  } catch {
    // Type checking can fail, fall back to name-based matching
    return null
  }
}

/**
 * Checks if a node is inside any Lingui localization context.
 *
 * Uses TypeScript type information to verify that macros actually come from Lingui,
 * with a fallback to name-based matching for edge cases.
 *
 * This includes:
 * - Tagged templates: t`Hello`
 * - JSX components: <Trans>, <Plural>, <Select>, <SelectOrdinal>
 * - Function macros: msg(), defineMessage(), plural(), select(), selectOrdinal()
 * - Runtime API: i18n.t(), i18n._()
 */
function isInsideLinguiContext(
  node: TSESTree.Node,
  typeChecker: ts.TypeChecker,
  parserServices: ReturnType<typeof ESLintUtils.getParserServices>
): boolean {
  let current: TSESTree.Node | undefined = node.parent ?? undefined

  while (current !== undefined) {
    // Tagged template: t`Hello ${name}`
    if (
      current.type === AST_NODE_TYPES.TaggedTemplateExpression &&
      current.tag.type === AST_NODE_TYPES.Identifier &&
      LINGUI_TAGGED_TEMPLATES.has(current.tag.name)
    ) {
      // Verify it's actually from Lingui (or use name-based fallback)
      const isLingui = isLinguiSymbol(current.tag, typeChecker, parserServices)
      if (isLingui === true || isLingui === null) {
        return true
      }
    }

    // JSX components: <Trans>Hello</Trans>, <Plural value={n} ... />
    if (
      current.type === AST_NODE_TYPES.JSXElement &&
      current.openingElement.name.type === AST_NODE_TYPES.JSXIdentifier &&
      LINGUI_JSX_COMPONENTS.has(current.openingElement.name.name)
    ) {
      // Verify it's actually from Lingui (or use name-based fallback)
      const isLingui = isLinguiSymbol(current.openingElement.name, typeChecker, parserServices)
      if (isLingui === true || isLingui === null) {
        return true
      }
    }

    // Function macros: msg({ message: "Hello" }), plural(n, {...})
    if (
      current.type === AST_NODE_TYPES.CallExpression &&
      current.callee.type === AST_NODE_TYPES.Identifier &&
      LINGUI_FUNCTION_MACROS.has(current.callee.name)
    ) {
      // Verify it's actually from Lingui (or use name-based fallback)
      const isLingui = isLinguiSymbol(current.callee, typeChecker, parserServices)
      if (isLingui === true || isLingui === null) {
        return true
      }
    }

    // Runtime API: i18n.t({ message: "Hello" }), i18n._("Hello")
    if (
      current.type === AST_NODE_TYPES.CallExpression &&
      current.callee.type === AST_NODE_TYPES.MemberExpression &&
      current.callee.object.type === AST_NODE_TYPES.Identifier &&
      current.callee.property.type === AST_NODE_TYPES.Identifier &&
      (current.callee.property.name === "t" || current.callee.property.name === "_")
    ) {
      // Check if the object is of type I18n from Lingui
      try {
        const objectTsNode = parserServices.esTreeNodeToTSNodeMap.get(current.callee.object)
        const objectType = typeChecker.getTypeAtLocation(objectTsNode)
        const typeName = typeChecker.typeToString(objectType)
        if (typeName === "I18n") {
          return true
        }
      } catch {
        // Type info not available
      }
      // Fallback: check if variable is named "i18n"
      if (current.callee.object.name === "i18n") {
        return true
      }
    }

    current = current.parent ?? undefined
  }

  return false
}

// ============================================================================
// Heuristic: Does this string look like user-visible text?
// ============================================================================

/**
 * Determines if a string looks like user-visible UI text.
 *
 * Returns TRUE (needs localization) for:
 * - Text with spaces and letters: "Hello World"
 * - Sentences starting with capital: "Save changes"
 * - Text with punctuation: "Are you sure?"
 * - Non-Latin scripts: "こんにちは", "Привет", "مرحبا"
 *
 * Returns FALSE (technical, skip) for:
 * - Empty/whitespace: "", "   "
 * - Single character: "-", "."
 * - Constants: "MY_CONSTANT"
 * - Identifiers: "myVariable", "my-css-class"
 * - URLs/paths: "https://...", "/api/users"
 * - CSS selectors: ":hover", ".class"
 */
function looksLikeUIString(value: string): boolean {
  const trimmed = value.trim()

  // Empty or whitespace only - not user text
  if (trimmed.length === 0) {
    return false
  }

  // Single character - likely technical (separator, bullet, etc.)
  if (trimmed.length === 1) {
    return false
  }

  // ALL_CAPS_WITH_UNDERSCORES - likely a constant
  if (/^[A-Z][A-Z0-9_]*$/.test(trimmed)) {
    return false
  }

  // Starts with protocol or path - URL or file path
  if (/^(\/|https?:|mailto:|tel:|#)/.test(trimmed)) {
    return false
  }

  // Looks like identifier: camelCase, kebab-case, snake_case (no spaces)
  if (/^[a-z][a-z0-9-_]*$/i.test(trimmed) && !trimmed.includes(" ")) {
    return false
  }

  // CSS selector: starts with :, ., #, [, *, &, >, +, ~
  if (/^[:.#[*&>+~]/.test(trimmed)) {
    return false
  }

  // SVG path data: commands like M, L, C, etc. followed by coordinates
  // Examples: "M10 10", "M0 0 L100 100", "M10,10 L20,20"
  if (/^[MLHVCSQTAZmlhvcsqtaz][\d\s,.-]+/.test(trimmed)) {
    return false
  }

  // Non-Latin scripts are almost always user-visible text
  // Ranges: CJK, Hangul, Cyrillic, Arabic, Hebrew, Thai, Hangul Jamo
  if (/[\u3000-\u9fff\uac00-\ud7af\u0400-\u04ff\u0600-\u06ff\u0590-\u05ff\u0e00-\u0e7f\u1100-\u11ff]/.test(trimmed)) {
    return true
  }

  // Contains letters AND spaces - likely a phrase or sentence
  if (/[a-zA-Z]/.test(trimmed) && /\s/.test(trimmed)) {
    return true
  }

  // Starts with capital followed by lowercase - likely a sentence start
  if (/^[A-Z][a-z]/.test(trimmed)) {
    return true
  }

  // Contains sentence punctuation - likely user text
  if (/[.!?:,]/.test(trimmed)) {
    return true
  }

  return false
}

// ============================================================================
// Ignored Function/Property Checks
// ============================================================================

/**
 * Extracts the full call chain name from a callee expression.
 *
 * Examples:
 * - foo() → "foo"
 * - console.log() → "console.log"
 * - a.b.c() → "a.b.c"
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
        return null // Computed property, can't determine name
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
 * Checks if a name matches a pattern that may contain wildcards.
 *
 * Patterns:
 * - "foo" matches exactly "foo"
 * - "console.*" matches "console.log", "console.error", etc.
 * - "*.headers.set" matches "ctx.headers.set", "request.headers.set", etc.
 */
function matchesWildcardPattern(name: string, pattern: string): boolean {
  if (pattern === name) {
    return true
  }

  if (!pattern.includes("*")) {
    return false
  }

  // Convert "console.*" to regex /^console\.[^.]+$/
  const regexPattern = pattern
    .split(".")
    .map((part) => (part === "*" ? "[^.]+" : part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))
    .join("\\.")

  return new RegExp(`^${regexPattern}$`).test(name)
}

/**
 * Checks if a string is an argument to an ignored function or constructor.
 *
 * Handles both:
 * - Function calls: console.log("...")
 * - Constructor calls: new Error("...")
 */
function isIgnoredFunctionArgument(node: TSESTree.Node, ignoreFunctions: string[]): boolean {
  const parent = node.parent

  // Regular function call: fn("string")
  if (parent?.type === AST_NODE_TYPES.CallExpression) {
    const calleeName = getCalleeName(parent.callee)
    if (calleeName !== null) {
      return ignoreFunctions.some((pattern) => matchesWildcardPattern(calleeName, pattern))
    }
  }

  // Constructor call: new Error("string")
  if (parent?.type === AST_NODE_TYPES.NewExpression) {
    const callee = parent.callee
    if (callee.type === AST_NODE_TYPES.Identifier) {
      return ignoreFunctions.some((pattern) => matchesWildcardPattern(callee.name, pattern))
    }
  }

  return false
}

/**
 * Checks if a string is an argument to a Console method (console.log, etc.)
 * using TypeScript type information.
 */
function isConsoleMethodArgument(
  node: TSESTree.Node,
  typeChecker: ts.TypeChecker,
  parserServices: ReturnType<typeof ESLintUtils.getParserServices>
): boolean {
  const parent = node.parent
  if (parent?.type !== AST_NODE_TYPES.CallExpression) {
    return false
  }

  const callee = parent.callee
  if (callee.type !== AST_NODE_TYPES.MemberExpression) {
    return false
  }

  try {
    const objectTsNode = parserServices.esTreeNodeToTSNodeMap.get(callee.object)
    const objectType = typeChecker.getTypeAtLocation(objectTsNode)
    const typeName = typeChecker.typeToString(objectType)

    // Check if the object is of type Console
    return typeName === "Console"
  } catch {
    return false
  }
}

/**
 * Checks if a string is an argument to an Error constructor
 * using TypeScript type information.
 */
function isErrorConstructorArgument(
  node: TSESTree.Node,
  typeChecker: ts.TypeChecker,
  parserServices: ReturnType<typeof ESLintUtils.getParserServices>
): boolean {
  const parent = node.parent
  if (parent?.type !== AST_NODE_TYPES.NewExpression) {
    return false
  }

  try {
    const calleeTsNode = parserServices.esTreeNodeToTSNodeMap.get(parent.callee)
    const calleeType = typeChecker.getTypeAtLocation(calleeTsNode)

    // Check if the constructor creates an Error type
    const constructSignatures = calleeType.getConstructSignatures()
    for (const sig of constructSignatures) {
      const returnType = sig.getReturnType()
      const returnTypeName = typeChecker.typeToString(returnType)

      // Check if it returns Error or any Error subtype
      if (returnTypeName === "Error" || returnTypeName.endsWith("Error")) {
        return true
      }

      // Check if the return type extends Error
      if ("getBaseTypes" in returnType && typeof returnType.getBaseTypes === "function") {
        const baseTypes = returnType.getBaseTypes()
        if (baseTypes !== undefined) {
          for (const baseType of baseTypes) {
            const baseTypeName = typeChecker.typeToString(baseType)
            if (baseTypeName === "Error") {
              return true
            }
          }
        }
      }
    }
  } catch {
    return false
  }

  return false
}

/**
 * Checks if a string is a value for an ignored property/attribute.
 */
function isIgnoredProperty(node: TSESTree.Node, ignoreProperties: string[]): boolean {
  const parent = node.parent

  // JSX attribute: <div className="..." />
  if (parent?.type === AST_NODE_TYPES.JSXAttribute) {
    if (parent.name.type === AST_NODE_TYPES.JSXIdentifier) {
      return ignoreProperties.includes(parent.name.name)
    }
  }

  // Object property: { className: "..." }
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

// ============================================================================
// Syntax Context Checks (non-user-facing locations)
// ============================================================================

/**
 * Checks if a string is in a TypeScript type context (not runtime code).
 *
 * Type contexts include: type aliases, interfaces, type annotations, type assertions
 */
function isInTypeContext(node: TSESTree.Node): boolean {
  let current: TSESTree.Node | undefined = node.parent ?? undefined

  while (current !== undefined) {
    switch (current.type) {
      case AST_NODE_TYPES.TSTypeAliasDeclaration:
      case AST_NODE_TYPES.TSInterfaceDeclaration:
      case AST_NODE_TYPES.TSTypeAnnotation:
      case AST_NODE_TYPES.TSAsExpression:
      case AST_NODE_TYPES.TSTypeAssertion:
        return true
    }
    current = current.parent ?? undefined
  }

  return false
}

/** Checks if a string is a switch case value: case "value": */
function isInSwitchCase(node: TSESTree.Node): boolean {
  const parent = node.parent
  return parent?.type === AST_NODE_TYPES.SwitchCase && parent.test === node
}

/** Checks if a string is a computed property key: obj["key"] */
function isComputedMemberKey(node: TSESTree.Node): boolean {
  const parent = node.parent
  return parent?.type === AST_NODE_TYPES.MemberExpression && parent.computed && parent.property === node
}

/**
 * Checks if a string is inside a non-Lingui tagged template.
 *
 * Strings inside css`...`, styled.div`...`, etc. should not be checked
 * since they're not user-visible text.
 */
function isInNonLinguiTaggedTemplate(node: TSESTree.Node): boolean {
  let current: TSESTree.Node | undefined = node.parent ?? undefined

  while (current !== undefined) {
    if (current.type === AST_NODE_TYPES.TaggedTemplateExpression) {
      // If it's a Lingui tag, it's handled by isInsideLinguiContext
      if (current.tag.type === AST_NODE_TYPES.Identifier && LINGUI_TAGGED_TEMPLATES.has(current.tag.name)) {
        return false
      }
      // Other tagged templates (css, styled, html, etc.)
      return true
    }
    current = current.parent ?? undefined
  }

  return false
}

/** Checks if a string is in an import/export statement (module path). */
function isInImportExport(node: TSESTree.Node): boolean {
  let current: TSESTree.Node | undefined = node.parent ?? undefined

  while (current !== undefined) {
    switch (current.type) {
      case AST_NODE_TYPES.ImportDeclaration:
      case AST_NODE_TYPES.ExportAllDeclaration:
      case AST_NODE_TYPES.ExportNamedDeclaration:
        return true
    }
    current = current.parent ?? undefined
  }

  return false
}

/** Checks if a string has an `as const` assertion. */
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

// ============================================================================
// TypeScript Type-Aware Checks
// ============================================================================

/** Type names from the Intl namespace that take string literal options. */
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
 * Checks if a type is a string literal union (technical type).
 */
function isStringLiteralUnion(type: ts.Type): boolean {
  if (type.isUnion()) {
    const hasStringLiteral = type.types.some((t) => t.isStringLiteral() || (t.flags & 128) !== 0)
    const allTechnical = type.types.every((t) => {
      // String literal
      if (t.isStringLiteral() || (t.flags & 128) !== 0) {
        return true
      }
      // Number literal
      if (t.isNumberLiteral() || (t.flags & 256) !== 0) {
        return true
      }
      // Boolean literals (true/false)
      if ((t.flags & 512) !== 0 || (t.flags & 1024) !== 0) {
        return true
      }
      // undefined
      if ((t.flags & 32768) !== 0) {
        return true
      }
      // null
      if ((t.flags & 65536) !== 0) {
        return true
      }
      return false
    })
    return hasStringLiteral && allTechnical
  }
  // Single string literal type
  return type.isStringLiteral() || (type.flags & 128) !== 0
}

/**
 * Uses TypeScript's type checker to determine if a string is technical.
 *
 * Detects:
 * - String literal union types: type Status = "loading" | "error"
 * - JSX attribute types: <input type="text" /> (type is "button" | "checkbox" | ...)
 * - Intl API arguments: toLocaleString("en-US", { weekday: "long" })
 * - Discriminated union fields: { type: "add" } | { type: "remove" }
 *
 * This is one of the main advantages of using TypeScript - we can
 * automatically detect that "loading" in `setStatus("loading")` is
 * technical if Status is typed as a union, without manual configuration.
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
      // Check for string literal unions: "a" | "b" | "c"
      if (isStringLiteralUnion(contextualType)) {
        return true
      }

      // Check for Intl API types
      const typeName = typeChecker.typeToString(contextualType)
      if (isIntlRelatedType(typeName)) {
        return true
      }
    }

    // Check for discriminated union patterns: { type: "value", kind: "value" }
    const parent = node.parent
    if (parent.type === AST_NODE_TYPES.Property) {
      const key = parent.key
      if (key.type === AST_NODE_TYPES.Identifier && (key.name === "type" || key.name === "kind")) {
        return true
      }
    }
  } catch {
    // Type checking can fail for various reasons, fall back to false
    return false
  }

  return false
}

// ============================================================================
// Rule Definition
// ============================================================================

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

    /**
     * Main check for string literals: "Hello World", 'Hello World'
     */
    function checkStringLiteral(node: TSESTree.Literal): void {
      if (typeof node.value !== "string") {
        return
      }

      const value = node.value

      // User-provided ignore pattern
      if (ignoreRegex?.test(value) === true) {
        return
      }

      // Heuristic: does it look like user text?
      if (!looksLikeUIString(value)) {
        return
      }

      // Already inside Lingui localization
      if (isInsideLinguiContext(node, typeChecker, parserServices)) {
        return
      }

      // TypeScript type definition (not runtime)
      if (isInTypeContext(node)) {
        return
      }

      // Switch case value
      if (isInSwitchCase(node)) {
        return
      }

      // Computed property access: obj["key"]
      if (isComputedMemberKey(node)) {
        return
      }

      // Non-Lingui tagged template: css`...`, styled.div`...`
      if (isInNonLinguiTaggedTemplate(node)) {
        return
      }

      // Import/export path
      if (isInImportExport(node)) {
        return
      }

      // `as const` assertion
      if (isAsConstAssertion(node)) {
        return
      }

      // Argument to ignored function
      if (isIgnoredFunctionArgument(node, options.ignoreFunctions)) {
        return
      }

      // Console method argument (type-aware)
      if (isConsoleMethodArgument(node, typeChecker, parserServices)) {
        return
      }

      // Error constructor argument (type-aware)
      if (isErrorConstructorArgument(node, typeChecker, parserServices)) {
        return
      }

      // Value for ignored property
      if (isIgnoredProperty(node, options.ignoreProperties)) {
        return
      }

      // TypeScript type-aware: string literal union, Intl API, etc.
      if (isTechnicalStringType(node, typeChecker, parserServices)) {
        return
      }

      // If we got here, it's likely an unlocalized user-visible string
      context.report({
        node,
        messageId: "unlocalizedString",
        data: {
          text: value.length > 30 ? `${value.substring(0, 30)}...` : value
        }
      })
    }

    /**
     * Check for JSX text content: <div>Hello World</div>
     */
    function checkJSXText(node: TSESTree.JSXText): void {
      const value = node.value.trim()

      if (value.length === 0) {
        return
      }

      if (ignoreRegex?.test(value) === true) {
        return
      }

      if (!looksLikeUIString(value)) {
        return
      }

      if (isInsideLinguiContext(node, typeChecker, parserServices)) {
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
