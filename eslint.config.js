import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";

export default [
    js.configs.recommended,
    {
        files: ["**/*.js"],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
            globals: {
                // GNOME Shell globals
                global: "readonly",
                imports: "readonly",
                log: "readonly",
                logError: "readonly",
                print: "readonly",
                printerr: "readonly",
                // GJS globals
                ARGV: "readonly",
                pkg: "readonly",
                // Node.js-like globals that GJS provides
                console: "readonly"
            }
        },
        rules: {
            // General rules
            "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
            "no-console": "off",
            "prefer-const": "error",
            "no-var": "error"
        }
    },
    {
        files: ["**/*.ts"],
        plugins: {
            "@typescript-eslint": tseslint
        },
        languageOptions: {
            parser: tsparser,
            parserOptions: {
                ecmaVersion: 2022,
                sourceType: "module"
            },
            globals: {
                // GNOME Shell globals
                global: "readonly",
                imports: "readonly",
                log: "readonly",
                logError: "readonly",
                print: "readonly",
                printerr: "readonly",
                // GJS globals
                ARGV: "readonly",
                pkg: "readonly",
                // Node.js-like globals that GJS provides
                console: "readonly"
            }
        },
        rules: {
            // Disable base ESLint rules that are covered by TypeScript
            "no-unused-vars": "off",
            "no-undef": "off",

            // TypeScript-specific rules
            "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/explicit-function-return-type": "off",
            "@typescript-eslint/explicit-module-boundary-types": "off",
            "@typescript-eslint/no-non-null-assertion": "off",

            // General rules
            "no-console": "off",
            "prefer-const": "error",
            "no-var": "error"
        }
    },
    {
        // Ignore patterns
        ignores: ["node_modules/**", "dist/**", "*.zip", "schemas/**"]
    }
];
