import { defineConfig } from "eslint/config"
import reactHooks from "eslint-plugin-react-hooks"
import tseslint from "typescript-eslint"

export default defineConfig([
  ...tseslint.configs.recommended,
  reactHooks.configs.flat.recommended,
  {
    rules: {
      // `_name` and rest siblings drop a prop on purpose (`{ required: _required, ...props }`).
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_", ignoreRestSiblings: true }],
      // React Compiler rules: the blocks aren't compiled by it, and these flag what it does on purpose — a mount effect that
      // starts a draw-in, a ref that tracks the latest value, a running total built during render.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
      "react-hooks/purity": "off",
      "react-hooks/immutability": "off",
    },
  },
])
