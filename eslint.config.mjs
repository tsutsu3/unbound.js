import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import eslintConfigPrettier from "eslint-config-prettier";

export default [
  {
    ignores: [
      "dist",
      "examples",
      "vite.config.ts",
      "eslint.config.mjs",
      "jest.config.ts",
      "coverage",
    ],
  },
  {
    files: ["**/*.{js,mjs,cjs,ts}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        sourceType: "module",
        project: "./tsconfig.eslint.json",
        tsconfigRootDir: import.meta.dirname,
      },
      globals: globals.node,
    },
  },
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  eslintConfigPrettier,
];
