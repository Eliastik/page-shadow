module.exports = {
    "env": {
        "browser": true,
        "es2021": true,
        "webextensions": true,
        "commonjs": true
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "ecmaVersion": 12,
        "sourceType": "module",
        "babelOptions": {
            configFile: "./babel.config.json",
        }
    },
    "rules": {
        "indent": [
            "error",
            4
        ],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "quotes": [
            "error",
            "double"
        ],
        "semi": [
            "error",
            "always"
        ],
        "no-var": [
            "error"
        ],
        "no-eval": [
            "error"
        ],
        "prefer-const": [
            "error"
        ],
        "no-implicit-globals": [
            "error"
        ],
        "prefer-arrow-callback": [
            "error"
        ],
        "no-trailing-spaces": [
            "warn"
        ],
        "no-console": [
            "warn"
        ],
        "no-debugger": [
            "warn"
        ],
        "brace-style": [
            "warn"
        ],
        "no-unused-vars": [
            "warn"
        ],
        "no-constant-binary-expression": [
            "warn"
        ],
        "valid-typeof": [
            "warn"
        ]
    },
    parser: "@babel/eslint-parser"
};
