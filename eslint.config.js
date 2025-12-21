import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";

export default [
  {
    ignores: [
      "dist",
      "node_modules",
      "src/components/**",
      "src/directives/**",
      "src/filters/**",
      "src/services/**",
      "src/main.js",
      "src/partials/**",
      "src/socket.io/**",
    ],
  },
  js.configs.recommended,
  {
    files: ["src/preact/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        sourceType: "module",
        ecmaVersion: "latest",
      },
      globals: {
        window: "readonly",
        document: "readonly",
      },
    },
    plugins: { "@typescript-eslint": tsPlugin },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": "warn",
    },
  },
];
