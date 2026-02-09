import { AST_NODE_TYPES, ESLintUtils, type TSESTree } from "@typescript-eslint/utils"
import ts from "typescript"

import { LINGUI_IGNORE_ARGS_BRAND, LINGUI_IGNORE_BRAND } from "../types.js"
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
  "classNames",
  // React key prop
  "key",
  // Testing ID - DOM Testing Library standard
  "data-testid",
  // SVG attributes that accept arbitrary strings (not detected by TypeScript types)
  // Note: Attributes with finite value sets like strokeLinecap, fillRule are auto-detected
  // via TypeScript's string literal union types
  "transform",
  "gradientTransform",
  "patternTransform",
  "preserveAspectRatio",
  "clipPath",
  "filter",
  "mask",
  "markerStart",
  "markerMid",
  "markerEnd",
  "strokeDasharray"
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

/** Function-style macros from Lingui (t can be both tagged template and function call) */
const LINGUI_FUNCTION_MACROS = new Set(["t", "msg", "defineMessage", "plural", "select", "selectOrdinal"])

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
 * Checks if a string looks like a date/time format string.
 *
 * Uses very conservative patterns to avoid false positives:
 * - 3+ consecutive same format token char (yyyy, MMMM, EEE) - very distinctive
 * - Common time patterns: HH:mm, hh:mm, mm:ss
 * - Common date patterns: MM/dd, yyyy-MM, etc.
 *
 * This prevents false positives on format strings from date-fns, moment, etc.
 */
function looksLikeDateFormatString(value: string): boolean {
  // Date format strings are typically short
  if (value.length > 25) {
    return false
  }

  // Very distinctive: 3+ consecutive same letter (yyyy, MMMM, EEE, etc.)
  // These are extremely rare in natural language
  if (/([yYMdDHhmsSwWEeQqLcIiRtTpPaAgGkKxXzZO])\1\1+/.test(value)) {
    return true
  }

  // Time format: HH:mm, hh:mm, HH:mm:ss
  if (/[Hh]{2}:[mM]{2}/.test(value)) {
    return true
  }

  // Date format with separators: yyyy-MM, MM-dd, MM/dd, etc.
  if (/[yY]{2,4}[-/][mM]{2}/.test(value) || /[mM]{2}[-/][dD]{2}/.test(value)) {
    return true
  }

  return false
}

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

  // Date/time format strings (e.g., "MMMM d, yyyy", "HH:mm:ss", "yyyy-MM-dd")
  // Detected by: short string with repeated format tokens and no long natural words
  if (looksLikeDateFormatString(trimmed)) {
    return false
  }

  // Non-Latin scripts are almost always user-visible text
  // Ranges: CJK, Hangul, Cyrillic, Arabic, Hebrew, Thai, Hangul Jamo
  if (/[\u3000-\u9fff\uac00-\ud7af\u0400-\u04ff\u0600-\u06ff\u0590-\u05ff\u0e00-\u0e7f\u1100-\u11ff]/.test(trimmed)) {
    return true
  }

  // No letters at all - likely numeric/symbolic (e.g., "1,00€", "1.000", "100%")
  if (!/\p{L}/u.test(trimmed)) {
    return false
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

/** Valid camelCase: lowercase start, then (Uppercase + lowercase+) sequences */
const CAMEL_CASE_PATTERN = /^[a-z]+([A-Z][a-z]+)+$/

/** Technical suffixes with at least one lowercase char before (ensures prefix exists) */
const STYLING_SUFFIX_PATTERN = /[a-z](ClassName|Class|Color|Style|Icon|Image|Size|Id)$/

/**
 * Checks if a property name is a styling/technical property.
 *
 * Matches camelCase properties ending with:
 * - "Class" or "ClassName": containerClassName, buttonClass
 * - "Color": backgroundColor, borderColor, textColor
 * - "Style": containerStyle, buttonStyle
 * - "Icon": leftIcon, statusIcon
 * - "Image": backgroundImage, avatarImage
 * - "Size": fontSize, iconSize
 * - "Id": containerId, elementId
 *
 * This covers common patterns for component libraries that accept
 * styling/technical props which contain technical values, not user text.
 */
function isStylingProperty(propertyName: string): boolean {
  return CAMEL_CASE_PATTERN.test(propertyName) && STYLING_SUFFIX_PATTERN.test(propertyName)
}

/** UPPER_CASE constant names with styling-related suffixes (singular and plural) */
const UPPER_CASE_STYLING_PATTERN =
  /^[A-Z][A-Z0-9]*(_[A-Z0-9]+)*_(CLASSNAMES?|CLASSES?|CLASS|COLORS?|STYLES?|ICONS?|IMAGES?|SIZES?|IDS?)$/

/** camelCase variable names with styling-related suffixes (plural forms for objects) */
const CAMEL_CASE_STYLING_VAR_PATTERN = /^[a-z][a-zA-Z]*(Classes|ClassNames?|Colors|Styles|Icons|Images|Sizes|Ids)$/

/** camelCase function names with styling-related suffixes (singular forms for return values) */
const STYLING_FUNCTION_NAME_PATTERN = /^[a-z][a-zA-Z]*(Class(Name)?|Color|Style|Icon|Image|Size|Id)$/

/**
 * Checks if a variable name is a styling/technical constant or variable.
 *
 * Matches UPPER_CASE constants ending with:
 * - "_CLASS", "_CLASSES", "_CLASSNAME", "_CLASSNAMES"
 * - "_COLOR", "_COLORS"
 * - "_STYLE", "_STYLES"
 * - "_ICON", "_ICONS"
 * - "_IMAGE", "_IMAGES"
 * - "_SIZE", "_SIZES"
 * - "_ID", "_IDS"
 *
 * Also matches camelCase variables ending with:
 * - "Classes", "ClassName", "ClassNames"
 * - "Colors", "Styles", "Icons", "Images", "Sizes", "Ids"
 *
 * Examples: STATUS_COLORS, BUTTON_CLASSES, colorClasses, buttonStyles
 */
function isStylingConstant(variableName: string): boolean {
  return UPPER_CASE_STYLING_PATTERN.test(variableName) || CAMEL_CASE_STYLING_VAR_PATTERN.test(variableName)
}

/**
 * Checks if a function name indicates it returns styling/technical values.
 *
 * Matches camelCase function names ending with:
 * - "Class", "ClassName": getButtonClass, computeClassName
 * - "Color": getStatusColor, computeBackgroundColor
 * - "Style": getContainerStyle
 * - "Icon", "Image", "Size", "Id"
 *
 * Examples: getStatusColor, getButtonClass, computeClassName
 */
function isStylingFunction(functionName: string): boolean {
  return STYLING_FUNCTION_NAME_PATTERN.test(functionName)
}

/**
 * Gets the name of a function declaration/expression if available.
 */
function getFunctionName(node: TSESTree.Node): string | null {
  if (node.type === AST_NODE_TYPES.FunctionDeclaration && node.id !== null) {
    return node.id.name
  }

  if (node.type === AST_NODE_TYPES.FunctionExpression || node.type === AST_NODE_TYPES.ArrowFunctionExpression) {
    // Check if assigned to a variable: const fn = () => {}
    const parent = node.parent
    if (parent.type === AST_NODE_TYPES.VariableDeclarator && parent.id.type === AST_NODE_TYPES.Identifier) {
      return parent.id.name
    }
    // Check if it's an object method: { fn: () => {} }
    if (parent.type === AST_NODE_TYPES.Property && parent.key.type === AST_NODE_TYPES.Identifier) {
      return parent.key.name
    }
  }

  return null
}

/**
 * Checks if a function returns a string type (or string | null | undefined).
 *
 * This prevents false positives where a function named e.g. "getStatusColor"
 * might return an object or array instead of a string.
 */
function functionReturnsString(
  node: TSESTree.FunctionDeclaration | TSESTree.FunctionExpression | TSESTree.ArrowFunctionExpression,
  typeChecker: ts.TypeChecker,
  parserServices: ReturnType<typeof ESLintUtils.getParserServices>
): boolean {
  try {
    const tsNode = parserServices.esTreeNodeToTSNodeMap.get(node)

    // Get the type of the function itself
    const functionType = typeChecker.getTypeAtLocation(tsNode)
    const callSignatures = functionType.getCallSignatures()

    if (callSignatures.length === 0) {
      // No call signatures - allow by name to avoid false positives
      return true
    }

    // Check all call signatures - all must return string-ish
    return callSignatures.every((signature) => {
      const returnType = typeChecker.getReturnTypeOfSignature(signature)
      return isStringishType(returnType, typeChecker)
    })
  } catch {
    // Type checking can fail - allow by name to avoid false positives
    return true
  }
}

/**
 * Checks if a type is string-ish: string, string literal, or union of these with null/undefined.
 */
function isStringishType(type: ts.Type, _typeChecker: ts.TypeChecker): boolean {
  const flags = type.getFlags()

  // Check if it's a union type
  if (type.isUnion()) {
    // All non-null/undefined members must be string-ish
    const nonNullableTypes = type.types.filter((t) => {
      const f = t.getFlags()
      // Skip null and undefined
      return (f & ts.TypeFlags.Null) === 0 && (f & ts.TypeFlags.Undefined) === 0
    })

    // If only null/undefined, that's not a string return
    if (nonNullableTypes.length === 0) {
      return false
    }

    return nonNullableTypes.every((t) => isStringishType(t, _typeChecker))
  }

  // String type or string literal
  if ((flags & ts.TypeFlags.String) !== 0 || (flags & ts.TypeFlags.StringLiteral) !== 0) {
    return true
  }

  // Template literal type
  if ((flags & ts.TypeFlags.TemplateLiteral) !== 0) {
    return true
  }

  return false
}

/**
 * Gets the property name if this node is (directly) a property value.
 */
function getPropertyName(node: TSESTree.Node): string | null {
  const parent = node.parent

  // JSX attribute: <div className="..." /> or <div className={...} />
  if (parent?.type === AST_NODE_TYPES.JSXAttribute && parent.name.type === AST_NODE_TYPES.JSXIdentifier) {
    return parent.name.name
  }

  // JSX expression container unwrap: className={...}
  if (parent?.type === AST_NODE_TYPES.JSXExpressionContainer) {
    const attr = parent.parent
    if (attr.type === AST_NODE_TYPES.JSXAttribute && attr.name.type === AST_NODE_TYPES.JSXIdentifier) {
      return attr.name.name
    }
  }

  // Object property: { className: "..." }
  if (parent?.type === AST_NODE_TYPES.Property && parent.value === node) {
    if (parent.key.type === AST_NODE_TYPES.Identifier) {
      return parent.key.name
    }
    if (parent.key.type === AST_NODE_TYPES.Literal && typeof parent.key.value === "string") {
      return parent.key.value
    }
  }

  return null
}

/**
 * Checks if a property name should be ignored (styling/technical property).
 */
function isTechnicalPropertyName(name: string, ignoreProperties: string[]): boolean {
  return ignoreProperties.includes(name) || isStylingProperty(name)
}

/**
 * Checks if a string is anywhere inside the value of a styling property.
 *
 * This handles complex patterns like:
 *   className={cn("class1", "class2")}
 *   className={cn("base", condition && "extra")}
 *   className={condition ? "a" : "b"}
 *   classNames={{ day: "text-white", cell: "bg-gray-100" }}
 *
 * Also handles styling helper functions (verified via TypeScript return type):
 *   function getStatusColor(status): string { return "bg-green-100" }
 *
 * Walks up the tree looking for a JSXAttribute or Property with a styling name.
 * Continues past non-styling properties to find parent styling properties.
 */
function isInsideStylingPropertyValue(
  node: TSESTree.Node,
  ignoreProperties: string[],
  typeChecker: ts.TypeChecker,
  parserServices: ReturnType<typeof ESLintUtils.getParserServices>
): boolean {
  let current: TSESTree.Node | undefined = node

  while (current !== undefined) {
    // Check if current node is directly the value of a styling property
    const propName = getPropertyName(current)
    if (propName !== null && isTechnicalPropertyName(propName, ignoreProperties)) {
      // Found a styling property - ignore this string
      return true
    }
    // If we found a non-styling property, continue up the tree
    // (the property might be nested inside a styling property like classNames: { day: "..." })

    // At function boundary - check if it's a styling helper function
    if (
      current.type === AST_NODE_TYPES.FunctionDeclaration ||
      current.type === AST_NODE_TYPES.FunctionExpression ||
      current.type === AST_NODE_TYPES.ArrowFunctionExpression
    ) {
      // If the function has a styling name AND returns a string type, ignore strings inside it
      const fnName = getFunctionName(current)
      if (fnName !== null && isStylingFunction(fnName) && functionReturnsString(current, typeChecker, parserServices)) {
        return true
      }
      // Otherwise, stop here (don't cross into non-styling functions)
      return false
    }

    current = current.parent ?? undefined
  }

  return false
}

/**
 * Checks if a string is a value for an ignored property/attribute (direct value only).
 */
function isIgnoredProperty(node: TSESTree.Node, ignoreProperties: string[]): boolean {
  const parent = node.parent

  // JSX attribute: <div className="..." />
  if (parent?.type === AST_NODE_TYPES.JSXAttribute) {
    if (parent.name.type === AST_NODE_TYPES.JSXIdentifier) {
      const name = parent.name.name
      if (isTechnicalPropertyName(name, ignoreProperties)) {
        return true
      }
    }
  }

  // Object property: { className: "..." }
  if (parent?.type === AST_NODE_TYPES.Property) {
    if (parent.key.type === AST_NODE_TYPES.Identifier) {
      const name = parent.key.name
      if (isTechnicalPropertyName(name, ignoreProperties)) {
        return true
      }
    }
    if (parent.key.type === AST_NODE_TYPES.Literal && typeof parent.key.value === "string") {
      const name = parent.key.value
      if (isTechnicalPropertyName(name, ignoreProperties)) {
        return true
      }
    }
  }

  return false
}

/**
 * Checks if a string is inside a variable assignment to a styling constant/variable.
 *
 * Matches structures like:
 *   const STATUS_COLORS = { active: "bg-green-100..." }
 *   const colorClasses = { primary: "text-blue-500" }
 *   const indicatorClassName = cn("shrink-0", { "w-1": condition })
 *
 * Does NOT match nested function calls or nested objects:
 *   const STATUS_COLORS = { active: fn("Hello") }     // fn() is nested in property
 *   const STATUS_COLORS = { active: { x: "Hello" } }  // nested object
 */
function isInsideStylingConstant(node: TSESTree.Node): boolean {
  let current: TSESTree.Node | undefined = node.parent ?? undefined
  let lastCallExpression: TSESTree.Node | undefined = undefined
  let objectDepth = 0

  while (current !== undefined) {
    // Track the most recent CallExpression we've passed through
    if (current.type === AST_NODE_TYPES.CallExpression) {
      lastCallExpression = current
    }

    // Track object nesting depth
    if (current.type === AST_NODE_TYPES.ObjectExpression) {
      objectDepth++
    }

    // Found a variable declarator - check if it has a styling name
    if (
      current.type === AST_NODE_TYPES.VariableDeclarator &&
      current.id.type === AST_NODE_TYPES.Identifier &&
      isStylingConstant(current.id.name)
    ) {
      // Check if the init is what we expect
      const init = current.init

      // Case 1: Direct object - const x = { key: "value" }
      if (init?.type === AST_NODE_TYPES.ObjectExpression) {
        // Only allow if:
        // - We didn't pass through a CallExpression (fn() inside property)
        // - We didn't pass through nested objects (depth must be 1)
        return lastCallExpression === undefined && objectDepth === 1
      }

      // Case 2: Direct function call - const x = cn("value", {...})
      if (init?.type === AST_NODE_TYPES.CallExpression) {
        // Only allow if the CallExpression we passed through IS the init
        return lastCallExpression === init
      }

      return false
    }

    // Stop at function boundaries (don't cross into function bodies)
    if (
      current.type === AST_NODE_TYPES.FunctionDeclaration ||
      current.type === AST_NODE_TYPES.FunctionExpression ||
      current.type === AST_NODE_TYPES.ArrowFunctionExpression
    ) {
      return false
    }

    current = current.parent ?? undefined
  }

  return false
}

// ============================================================================
// Syntax Context Checks (non-user-facing locations)
// ============================================================================

/** React directive strings */
const REACT_DIRECTIVES = new Set(["use client", "use server"])

/**
 * Checks if a string literal is a React directive.
 *
 * React directives are special string literals:
 * - "use client" - marks a client component boundary (file level)
 * - "use server" - marks server actions (file level or inside async functions)
 */
function isReactDirective(node: TSESTree.Node): boolean {
  if (node.type !== AST_NODE_TYPES.Literal || typeof node.value !== "string") {
    return false
  }

  if (!REACT_DIRECTIVES.has(node.value)) {
    return false
  }

  // Must be wrapped in an expression statement
  const parent = node.parent
  if (parent.type !== AST_NODE_TYPES.ExpressionStatement) {
    return false
  }

  const grandparent = parent.parent

  // File-level directive
  if (grandparent.type === AST_NODE_TYPES.Program) {
    return true
  }

  // Function-level directive (e.g., "use server" inside async function)
  if (grandparent.type === AST_NODE_TYPES.BlockStatement) {
    const functionParent = grandparent.parent
    return (
      functionParent.type === AST_NODE_TYPES.FunctionDeclaration ||
      functionParent.type === AST_NODE_TYPES.FunctionExpression ||
      functionParent.type === AST_NODE_TYPES.ArrowFunctionExpression
    )
  }

  return false
}

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

/**
 * Checks if a string is an import/export module source specifier.
 *
 * Only returns true for the module path in:
 * - import "module-path"
 * - import x from "module-path"
 * - export * from "module-path"
 * - export { x } from "module-path"
 *
 * Does NOT return true for strings inside exported declarations:
 * - export function foo() { return "Hello World" } ← "Hello World" should be checked
 */
function isImportExportSource(node: TSESTree.Node): boolean {
  const parent = node.parent
  if (parent === undefined) {
    return false
  }

  // Check if this literal is the `source` property of an import/export
  switch (parent.type) {
    case AST_NODE_TYPES.ImportDeclaration:
      return parent.source === node
    case AST_NODE_TYPES.ExportAllDeclaration:
      return parent.source === node
    case AST_NODE_TYPES.ExportNamedDeclaration:
      return parent.source === node
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
 * Checks if a type has the __linguiIgnore brand marker.
 *
 * This detects branded types exported from this plugin:
 * - UnlocalizedText, UnlocalizedLog, UnlocalizedLogParam, etc.
 *
 * These types are defined as: `string & { readonly __linguiIgnore?: "TypeName" }`
 * For flexible types like UnlocalizedLogParam, it's a union of branded primitives.
 */
function hasLinguiIgnoreBrand(type: ts.Type, typeChecker: ts.TypeChecker): boolean {
  // Check if the type is a union - for UnlocalizedLogParam which is (string & X) | (number & X) | ...
  // We check if ANY member of the union has the brand (since we're checking if strings should be ignored)
  if (type.isUnion()) {
    return type.types.some((t) => hasLinguiIgnoreBrand(t, typeChecker))
  }

  // Check if the type is an intersection (string & { __linguiIgnore: ... })
  if (type.isIntersection()) {
    return type.types.some((t) => hasLinguiIgnoreBrand(t, typeChecker))
  }

  // Check if the type has the brand property
  const brandProperty = type.getProperty(LINGUI_IGNORE_BRAND)
  if (brandProperty !== undefined) {
    return true
  }

  // Fallback: check type string for __linguiIgnore
  const typeString = typeChecker.typeToString(type)
  return typeString.includes(LINGUI_IGNORE_BRAND)
}

function resolveSymbol(symbol: ts.Symbol, typeChecker: ts.TypeChecker): ts.Symbol {
  return (symbol.flags & ts.SymbolFlags.Alias) !== 0 ? typeChecker.getAliasedSymbol(symbol) : symbol
}

function getEntityNameText(entityName: ts.EntityName): string {
  if (ts.isIdentifier(entityName)) {
    return entityName.text
  }
  return `${getEntityNameText(entityName.left)}.${entityName.right.text}`
}

function getBrandedRecordKeyTypeFromTypeNode(
  typeNode: ts.TypeNode,
  typeChecker: ts.TypeChecker,
  visitedSymbols: Set<ts.Symbol>
): ts.Type | undefined {
  if (ts.isParenthesizedTypeNode(typeNode)) {
    return getBrandedRecordKeyTypeFromTypeNode(typeNode.type, typeChecker, visitedSymbols)
  }

  if (ts.isUnionTypeNode(typeNode) || ts.isIntersectionTypeNode(typeNode)) {
    for (const childType of typeNode.types) {
      const keyType = getBrandedRecordKeyTypeFromTypeNode(childType, typeChecker, visitedSymbols)
      if (keyType !== undefined) {
        return keyType
      }
    }
    return undefined
  }

  if (ts.isMappedTypeNode(typeNode)) {
    const constraint = typeNode.typeParameter.constraint
    if (constraint !== undefined) {
      return typeChecker.getTypeFromTypeNode(constraint)
    }
    return undefined
  }

  if (!ts.isTypeReferenceNode(typeNode)) {
    return undefined
  }

  if (getEntityNameText(typeNode.typeName) === "Record") {
    const keyTypeArg = typeNode.typeArguments?.[0]
    if (keyTypeArg !== undefined) {
      return typeChecker.getTypeFromTypeNode(keyTypeArg)
    }
    return undefined
  }

  const symbol = typeChecker.getSymbolAtLocation(typeNode.typeName)
  if (symbol === undefined) {
    return undefined
  }
  const resolved = resolveSymbol(symbol, typeChecker)
  if (visitedSymbols.has(resolved)) {
    return undefined
  }
  visitedSymbols.add(resolved)

  const declarations = resolved.getDeclarations() ?? []
  for (const declaration of declarations) {
    if (ts.isTypeAliasDeclaration(declaration)) {
      const keyType = getBrandedRecordKeyTypeFromTypeNode(declaration.type, typeChecker, visitedSymbols)
      if (keyType !== undefined) {
        return keyType
      }
    }

    if (ts.isInterfaceDeclaration(declaration)) {
      for (const member of declaration.members) {
        if (ts.isIndexSignatureDeclaration(member)) {
          const keyParamType = member.parameters[0]?.type
          if (keyParamType !== undefined) {
            return typeChecker.getTypeFromTypeNode(keyParamType)
          }
        }
      }

      for (const heritageClause of declaration.heritageClauses ?? []) {
        for (const clauseType of heritageClause.types) {
          const keyType = getBrandedRecordKeyTypeFromTypeNode(clauseType, typeChecker, visitedSymbols)
          if (keyType !== undefined) {
            return keyType
          }
        }
      }
    }
  }

  return undefined
}

function getBrandedRecordKeyType(
  type: ts.Type,
  typeChecker: ts.TypeChecker,
  visitedSymbols: Set<ts.Symbol> = new Set<ts.Symbol>()
): ts.Type | undefined {
  if (type.aliasSymbol !== undefined && type.aliasSymbol.escapedName.toString() === "Record") {
    const keyType = type.aliasTypeArguments?.[0]
    if (keyType !== undefined) {
      return keyType
    }
  }

  if (type.isUnion() || type.isIntersection()) {
    for (const childType of type.types) {
      const keyType = getBrandedRecordKeyType(childType, typeChecker, visitedSymbols)
      if (keyType !== undefined) {
        return keyType
      }
    }
  }

  const symbol = type.aliasSymbol ?? type.getSymbol()
  if (symbol === undefined) {
    return undefined
  }

  const resolved = resolveSymbol(symbol, typeChecker)
  if (visitedSymbols.has(resolved)) {
    return undefined
  }
  visitedSymbols.add(resolved)

  const declarations = resolved.getDeclarations() ?? []
  for (const declaration of declarations) {
    if (ts.isTypeAliasDeclaration(declaration)) {
      const keyType = getBrandedRecordKeyTypeFromTypeNode(declaration.type, typeChecker, visitedSymbols)
      if (keyType !== undefined) {
        return keyType
      }
    }

    if (ts.isInterfaceDeclaration(declaration)) {
      for (const member of declaration.members) {
        if (ts.isIndexSignatureDeclaration(member)) {
          const keyParamType = member.parameters[0]?.type
          if (keyParamType !== undefined) {
            return typeChecker.getTypeFromTypeNode(keyParamType)
          }
        }
      }
    }
  }

  return undefined
}

function isBrandedObjectKeyLiteral(
  node: TSESTree.Literal,
  typeChecker: ts.TypeChecker,
  parserServices: ReturnType<typeof ESLintUtils.getParserServices>
): boolean {
  const parent = node.parent
  if (parent.type !== AST_NODE_TYPES.Property || parent.key !== node || parent.computed) {
    return false
  }

  const objectExpression = parent.parent
  if (objectExpression.type !== AST_NODE_TYPES.ObjectExpression) {
    return false
  }

  try {
    const objectTsNode = parserServices.esTreeNodeToTSNodeMap.get(objectExpression)
    const contextualType = typeChecker.getContextualType(objectTsNode)
    if (contextualType === undefined) {
      return false
    }

    const keyType = getBrandedRecordKeyType(contextualType, typeChecker)
    return keyType !== undefined && hasLinguiIgnoreBrand(keyType, typeChecker)
  } catch {
    return false
  }
}

/**
 * Checks if a function call's callee (the function/method being called) has the
 * __linguiIgnoreArgs brand, meaning all string arguments should be ignored.
 *
 * This handles the `UnlocalizedFunction<T>` wrapper type:
 * ```ts
 * const logger: UnlocalizedFunction<Logger> = createLogger()
 * logger.info("All strings ignored")  // ✅ Not flagged
 * ```
 */
function isUnlocalizedFunctionCall(
  node: TSESTree.Node,
  typeChecker: ts.TypeChecker,
  parserServices: ReturnType<typeof ESLintUtils.getParserServices>
): boolean {
  const parent = node.parent
  if (parent?.type !== AST_NODE_TYPES.CallExpression) {
    return false
  }

  try {
    const callee = parent.callee

    // For method calls (obj.method()), check the object's type
    if (callee.type === AST_NODE_TYPES.MemberExpression) {
      const objectTsNode = parserServices.esTreeNodeToTSNodeMap.get(callee.object)
      const objectType = typeChecker.getTypeAtLocation(objectTsNode)

      // Check if the object type has __linguiIgnoreArgs
      const ignoreArgsProp = objectType.getProperty(LINGUI_IGNORE_ARGS_BRAND)
      if (ignoreArgsProp !== undefined) {
        return true
      }

      // Fallback: check type string
      const typeString = typeChecker.typeToString(objectType)
      if (typeString.includes(LINGUI_IGNORE_ARGS_BRAND)) {
        return true
      }
    }

    // For direct function calls (fn()), check the function's type
    if (callee.type === AST_NODE_TYPES.Identifier) {
      const calleeTsNode = parserServices.esTreeNodeToTSNodeMap.get(callee)
      const calleeType = typeChecker.getTypeAtLocation(calleeTsNode)

      const ignoreArgsProp = calleeType.getProperty(LINGUI_IGNORE_ARGS_BRAND)
      if (ignoreArgsProp !== undefined) {
        return true
      }

      const typeString = typeChecker.typeToString(calleeType)
      if (typeString.includes(LINGUI_IGNORE_ARGS_BRAND)) {
        return true
      }
    }
  } catch {
    // Type checking can fail
  }

  return false
}

/**
 * Gets the parameter type for an argument in a function call.
 *
 * This is needed for branded types in function parameters.
 */
function getParameterTypeForArgument(
  node: TSESTree.Node,
  typeChecker: ts.TypeChecker,
  parserServices: ReturnType<typeof ESLintUtils.getParserServices>
): ts.Type | undefined {
  const parent = node.parent
  if (parent?.type !== AST_NODE_TYPES.CallExpression) {
    return undefined
  }

  // Find the argument index
  const argIndex = parent.arguments.indexOf(node as TSESTree.CallExpressionArgument)
  if (argIndex === -1) {
    return undefined
  }

  try {
    const calleeTsNode = parserServices.esTreeNodeToTSNodeMap.get(parent.callee)
    const calleeType = typeChecker.getTypeAtLocation(calleeTsNode)
    const callSignatures = calleeType.getCallSignatures()

    if (callSignatures.length === 0) {
      return undefined
    }

    // Use the first call signature
    const signature = callSignatures[0]
    if (signature === undefined) {
      return undefined
    }

    const parameters = signature.getParameters()

    // Check if it's a rest parameter
    const lastParam = parameters[parameters.length - 1]
    if (lastParam !== undefined && argIndex >= parameters.length - 1) {
      const lastParamDecl = lastParam.valueDeclaration
      if (lastParamDecl !== undefined && ts.isParameter(lastParamDecl) && lastParamDecl.dotDotDotToken !== undefined) {
        // It's a rest parameter, get the element type
        const restType = typeChecker.getTypeOfSymbol(lastParam)
        if (typeChecker.isArrayType(restType)) {
          const typeArgs = typeChecker.getTypeArguments(restType as ts.TypeReference)
          if (typeArgs.length > 0) {
            return typeArgs[0]
          }
        }
        return restType
      }
    }

    // Regular parameter
    const param = parameters[argIndex]
    if (param === undefined) {
      return undefined
    }

    return typeChecker.getTypeOfSymbol(param)
  } catch {
    return undefined
  }
}

/**
 * Checks if a string literal is passed to a parameter with a Lingui branded type,
 * or if the callee has the __linguiIgnoreArgs brand (UnlocalizedFunction<T>).
 *
 * This enables users to mark their own types as "no translation needed" by using
 * the branded types exported from this plugin:
 *
 * ```ts
 * // Option 1: Brand individual parameters
 * import type { UnlocalizedLog } from "eslint-plugin-lingui-typescript/types"
 *
 * interface Logger {
 *   info(message: UnlocalizedLog): void
 * }
 *
 * // Option 2: Brand the entire function/object
 * import type { UnlocalizedFunction } from "eslint-plugin-lingui-typescript/types"
 *
 * const logger: UnlocalizedFunction<Logger> = createLogger()
 * logger.info("All strings ignored")  // ✅ Not flagged
 * ```
 */
function isLinguiBrandedType(
  node: TSESTree.Literal,
  typeChecker: ts.TypeChecker,
  parserServices: ReturnType<typeof ESLintUtils.getParserServices>
): boolean {
  try {
    // Check if the entire function/object is branded with __linguiIgnoreArgs
    if (isUnlocalizedFunctionCall(node, typeChecker, parserServices)) {
      return true
    }

    const tsNode = parserServices.esTreeNodeToTSNodeMap.get(node)
    const contextualType = typeChecker.getContextualType(tsNode)

    // Check contextual type (works for string-based branded types)
    if (contextualType !== undefined && hasLinguiIgnoreBrand(contextualType, typeChecker)) {
      return true
    }

    // Check parameter type directly (needed for branded types in function parameters)
    const paramType = getParameterTypeForArgument(node, typeChecker, parserServices)
    if (paramType !== undefined && hasLinguiIgnoreBrand(paramType, typeChecker)) {
      return true
    }
  } catch {
    // Type checking can fail, fall back to false
  }

  return false
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

      // Object-literal key in Record<BrandedKey, ...> context (e.g., Record<UnlocalizedKey, ...>)
      if (isBrandedObjectKeyLiteral(node, typeChecker, parserServices)) {
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

      // React directives: "use client", "use server"
      if (isReactDirective(node)) {
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

      // Import/export module source specifier
      if (isImportExportSource(node)) {
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

      // Value for ignored property (direct)
      if (isIgnoredProperty(node, options.ignoreProperties)) {
        return
      }

      // Inside a styling property value (e.g., className={cn("class1", "class2")})
      if (isInsideStylingPropertyValue(node, options.ignoreProperties, typeChecker, parserServices)) {
        return
      }

      // Inside a styling constant (e.g., STATUS_COLORS, BUTTON_CLASSES)
      if (isInsideStylingConstant(node)) {
        return
      }

      // TypeScript type-aware: string literal union, Intl API, etc.
      if (isTechnicalStringType(node, typeChecker, parserServices)) {
        return
      }

      // Lingui branded types: LogMessage, CSSValue, CSSClassName, TechnicalString
      if (isLinguiBrandedType(node, typeChecker, parserServices)) {
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
