import { ESLintUtils } from "@typescript-eslint/utils"

/**
 * Creates a typed ESLint rule with documentation URL generation.
 */
export const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/user/eslint-plugin-lingui-typescript/blob/main/docs/rules/${name}.md`
)
