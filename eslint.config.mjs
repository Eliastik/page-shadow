import globals from "globals";
import babelParser from "@babel/eslint-parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [...compat.extends("eslint:recommended"), {
    languageOptions: {
        globals: {
            ...globals.browser,
            ...globals.webextensions,
            ...globals.commonjs,
        },

        parser: babelParser,
        ecmaVersion: 12,
        sourceType: "module",

        parserOptions: {
            babelOptions: {
                configFile: "./babel.config.json",
            },
        },
    },

    rules: {
        indent: ["error", 4],
        "linebreak-style": ["off", "unix"],
        quotes: ["error", "double"],
        semi: ["error", "always"],
        "no-var": ["error"],
        "no-eval": ["error"],
        "prefer-const": ["error"],
        "no-implicit-globals": ["error"],
        "prefer-arrow-callback": ["error"],
        "no-trailing-spaces": ["warn"],
        "no-console": ["warn"],
        "no-debugger": ["warn"],
        "brace-style": ["warn"],
        "no-unused-vars": ["warn"],
        "no-constant-binary-expression": ["warn"],
        "valid-typeof": ["warn"],
        "require-await": ["error"],
        "no-return-await": ["error"],
        "camelcase": ["warn"],
        "no-implied-eval": ["error"],
        "no-lonely-if": ["warn"],
        "no-return-assign": ["error"],
        "no-sequences": ["error"]
    },
}];