/**
 * ESLint Plugin for Lingui with TypeScript type-aware rules
 *
 * @packageDocumentation
 */

// TODO: Import rules when implemented
// import { noComplexExpressionsInMessage } from "./rules/no-complex-expressions-in-message.js";

const plugin = {
  meta: {
    name: "eslint-plugin-lingui",
    version: "1.0.0",
  },
  rules: {
    // Rules will be added here as they are implemented
  },
  configs: {},
};

// Add self-reference for flat config
const flatRecommended = {
  plugins: {
    lingui: plugin,
  },
  rules: {
    // Recommended rules will be added here
  },
};

plugin.configs = {
  "flat/recommended": flatRecommended,
};

export default plugin;
