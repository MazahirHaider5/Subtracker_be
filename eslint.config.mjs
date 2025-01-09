import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import prettierPlugin from "eslint-plugin-prettier";
import typescriptEslintParser from "@typescript-eslint/parser";
import typescriptEslintPlugin from "@typescript-eslint/eslint-plugin";

export default [
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: typescriptEslintParser,
      parserOptions: {
        project: "./tsconfig.json"
      }
    },
    plugins: {
      "@typescript-eslint": typescriptEslintPlugin,
      prettier: prettierPlugin
    },
    rules: {
      ...typescriptEslintPlugin.configs.recommended.rules,
      "prettier/prettier": "error",
      "linebreak-style": ["error", "unix"]
    }
  },
  {
    files: ["**/*.js"],
    languageOptions: {
      parser: js
    },
    plugins: {
      prettier: prettierPlugin
    },
    rules: {
      "prettier/prettier": "error"
    }
  },
  {
    files: ["**/*.{js,ts,tsx}"],
    rules: {
      "prettier/prettier": "error"
    }
  },
  {
    ignores: ["node_modules", "dist"]
  },
  prettier
];
