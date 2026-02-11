/**
 * Branded types for marking strings that should not be translated.
 *
 * These types use TypeScript's structural typing with a phantom property
 * to create nominally distinct string types. The `__linguiIgnore` property
 * never exists at runtime - it's purely for type-level discrimination.
 *
 * Usage:
 * ```ts
 * import type { UnlocalizedLog } from "eslint-plugin-lingui-typescript/types"
 *
 * interface Logger {
 *   debug(message: UnlocalizedLog): void
 *   info(message: UnlocalizedLog): void
 * }
 * ```
 *
 * The `no-unlocalized-strings` rule automatically detects these types
 * and ignores strings passed to parameters with these types.
 *
 * @module
 */

/**
 * Brand marker property name used by all Lingui ignore types.
 * The rule checks for this property to detect branded types.
 */
export const LINGUI_IGNORE_BRAND = "__linguiIgnore" as const

/**
 * Brand marker for functions/objects where all arguments should be ignored.
 */
export const LINGUI_IGNORE_ARGS_BRAND = "__linguiIgnoreArgs" as const

// =============================================================================
// Function wrapper type
// =============================================================================

/**
 * Marks a function or object so that ALL string arguments are ignored by the rule.
 *
 * Use this to wrap logger interfaces, analytics trackers, or any other
 * functions where you want to ignore all string arguments without typing
 * each parameter individually.
 *
 * @example
 * ```ts
 * import type { UnlocalizedFunction } from "eslint-plugin-lingui-typescript/types"
 *
 * interface Logger {
 *   debug(...args: unknown[]): void
 *   info(...args: unknown[]): void
 *   warn(...args: unknown[]): void
 *   error(...args: unknown[]): void
 * }
 *
 * // Option A: Type the variable
 * const logger: UnlocalizedFunction<Logger> = createLogger()
 *
 * // Option B: Type the factory return
 * function createLogger(): UnlocalizedFunction<Logger> { ... }
 *
 * // Option C: Use the unlocalized() helper (recommended)
 * function createLogger() {
 *   return unlocalized({
 *     info: (...args: unknown[]) => console.info(...args),
 *   })
 * }
 *
 * // All string arguments are now ignored
 * logger.info("Server started on port", 3000)  // ✅ Not flagged
 * logger.error("Connection failed:", error)    // ✅ Not flagged
 * logger.debug({ request }, "received")        // ✅ Not flagged
 * ```
 */
export type UnlocalizedFunction<T> = T & { readonly __linguiIgnoreArgs?: true }

/**
 * Helper function to mark a value as unlocalized.
 *
 * This is an identity function that returns the input unchanged at runtime,
 * but changes the compile-time type to include the `__linguiIgnoreArgs` brand.
 * This allows automatic type inference without manual type annotations.
 *
 * @example
 * ```ts
 * import { unlocalized } from "eslint-plugin-lingui-typescript/types"
 *
 * function createLogger(prefix = "[App]") {
 *   return unlocalized({
 *     debug: (...args: unknown[]) => console.debug(prefix, ...args),
 *     info: (...args: unknown[]) => console.info(prefix, ...args),
 *     warn: (...args: unknown[]) => console.warn(prefix, ...args),
 *     error: (...args: unknown[]) => console.error(prefix, ...args),
 *   })
 * }
 *
 * // Automatically typed as UnlocalizedFunction<Logger>
 * const logger = createLogger()
 * logger.info("Server started")  // ✅ Not flagged
 * ```
 */
export function unlocalized<T>(value: T): UnlocalizedFunction<T> {
  return value as UnlocalizedFunction<T>
}

// =============================================================================
// Base branded type
// =============================================================================

/**
 * Generic branded string type for any text that should not be translated.
 *
 * Use this as a catch-all for strings that are clearly not user-facing text
 * but don't fit into the more specific categories.
 *
 * @example
 * ```ts
 * import type { UnlocalizedText } from "eslint-plugin-lingui-typescript/types"
 *
 * interface ApiConfig {
 *   endpoint: UnlocalizedText
 *   apiKey: UnlocalizedText
 * }
 * ```
 */
export type UnlocalizedText = string & { readonly __linguiIgnore?: "UnlocalizedText" }

// =============================================================================
// Logging types
// =============================================================================

/**
 * String type for log messages that should not be translated.
 *
 * Use this for logger interfaces to mark string message parameters as technical.
 * For loggers that accept any type (like `console.log`), use `UnlocalizedFunction<T>`
 * to wrap the entire logger interface instead.
 *
 * @example
 * ```ts
 * import type { UnlocalizedLog } from "eslint-plugin-lingui-typescript/types"
 *
 * interface Logger {
 *   debug(message: UnlocalizedLog): void
 *   info(message: UnlocalizedLog): void
 *   warn(message: UnlocalizedLog): void
 *   error(message: UnlocalizedLog): void
 * }
 *
 * const logger: Logger = createLogger()
 * logger.info("Starting server on port 3000") // ✅ Not flagged
 * ```
 *
 * @see UnlocalizedFunction for wrapping entire logger interfaces
 */
export type UnlocalizedLog = string & { readonly __linguiIgnore?: "UnlocalizedLog" }

// =============================================================================
// Styling types
// =============================================================================

/**
 * String type for style values that should not be translated.
 *
 * Use this for theme configurations, style objects, or any styling-related strings
 * like colors, fonts, spacing, etc.
 *
 * @example
 * ```ts
 * import type { UnlocalizedStyle } from "eslint-plugin-lingui-typescript/types"
 *
 * interface ThemeConfig {
 *   primaryColor: UnlocalizedStyle
 *   fontFamily: UnlocalizedStyle
 *   spacing: UnlocalizedStyle
 * }
 *
 * const theme: ThemeConfig = {
 *   primaryColor: "#3b82f6",        // ✅ Not flagged
 *   fontFamily: "Inter, sans-serif", // ✅ Not flagged
 *   spacing: "1rem",                // ✅ Not flagged
 * }
 * ```
 */
export type UnlocalizedStyle = string & { readonly __linguiIgnore?: "UnlocalizedStyle" }

/**
 * String type for CSS class names that should not be translated.
 *
 * Use this for component props that accept CSS class names.
 *
 * @example
 * ```ts
 * import type { UnlocalizedClassName } from "eslint-plugin-lingui-typescript/types"
 *
 * interface ButtonProps {
 *   className?: UnlocalizedClassName
 *   iconClassName?: UnlocalizedClassName
 * }
 *
 * <Button className="px-4 py-2 bg-blue-500" /> // ✅ Not flagged
 * ```
 */
export type UnlocalizedClassName = string & { readonly __linguiIgnore?: "UnlocalizedClassName" }

// =============================================================================
// Analytics/Tracking types
// =============================================================================

/**
 * String type for analytics event names that should not be translated.
 *
 * Use this for tracking/analytics interfaces where event names look like
 * user text but are actually technical identifiers.
 *
 * @example
 * ```ts
 * import type { UnlocalizedEvent } from "eslint-plugin-lingui-typescript/types"
 *
 * interface Analytics {
 *   track(event: UnlocalizedEvent, data?: object): void
 *   page(name: UnlocalizedEvent): void
 * }
 *
 * analytics.track("User Signed Up")        // ✅ Not flagged
 * analytics.track("Purchase Completed")    // ✅ Not flagged
 * analytics.page("Settings Page Viewed")   // ✅ Not flagged
 * ```
 */
export type UnlocalizedEvent = string & { readonly __linguiIgnore?: "UnlocalizedEvent" }

// =============================================================================
// Storage/Query types
// =============================================================================

/**
 * String type for storage keys, query keys, and similar identifiers.
 *
 * Use this for localStorage/sessionStorage keys, React Query keys,
 * or any other key-based storage system where keys might look like text.
 *
 * @example
 * ```ts
 * import type { UnlocalizedKey } from "eslint-plugin-lingui-typescript/types"
 *
 * interface Storage {
 *   get(key: UnlocalizedKey): string | null
 *   set(key: UnlocalizedKey, value: string): void
 * }
 *
 * storage.get("User Preferences")     // ✅ Not flagged
 * storage.set("Auth Token", token)    // ✅ Not flagged
 *
 * // React Query example
 * interface QueryOptions {
 *   queryKey: UnlocalizedKey[]
 * }
 *
 * useQuery({ queryKey: ["User Data", id] }) // ✅ Not flagged
 * ```
 */
export type UnlocalizedKey = string & { readonly __linguiIgnore?: "UnlocalizedKey" }

// =============================================================================
// Record/Map types
// =============================================================================

/**
 * Record type for key-value maps where all values are unlocalized strings.
 *
 * Use this for dictionaries, lookup tables, configuration maps, or component
 * props that map string keys to technical string values.
 *
 * @example
 * ```ts
 * import type { UnlocalizedRecord } from "eslint-plugin-lingui-typescript/types"
 *
 * // Simple key-value map
 * const svgProps: UnlocalizedRecord = { fill: "red", stroke: "blue" }
 *
 * // With typed keys
 * type SvgProp = "fill" | "stroke" | "opacity"
 * const defaults: UnlocalizedRecord<SvgProp> = {
 *   fill: "currentColor",
 *   stroke: "none",
 *   opacity: "1",
 * }
 *
 * // Component props
 * interface IconProps {
 *   attrs: UnlocalizedRecord
 * }
 * ```
 */
export type UnlocalizedRecord<K extends string = string> = Record<K, UnlocalizedText>
